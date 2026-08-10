import type { Asset, MaintenanceLogEntry } from "@/types/assets";
import type { AssetRow } from "@/server/db/schema";
import {
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";
import type { ActorContext } from "@/server/shared/auth";
import { generateOperationalCode, todayDateString } from "@/server/shared/codes";
import { withTransaction } from "@/server/db/transaction";
import { BorrowLogService } from "@/server/modules/borrow-log/borrow-log.service";
import { BorrowLogRepository } from "@/server/modules/borrow-log/borrow-log.repository";
import { MaintenanceRepository } from "@/server/modules/maintenance/maintenance.repository";
import { PurchaseLotService } from "@/server/modules/purchase-lots/purchase-lot.service";
import { SupplierRepository } from "@/server/modules/suppliers/supplier.repository";

import { AssetLifecycleService } from "./asset.lifecycle.service";
import { buildAssetFieldChanges } from "./asset.lifecycle.types";
import { AssetRepository } from "./asset.repository";
import type { ListAssetsFilters } from "./asset.types";
import {
  assetIdSchema,
  createAssetSchema,
  flagMaintenanceSchema,
  listAssetsQuerySchema,
  releaseAssetSchema,
  returnAssetSchema,
  updateAssetSchema,
  type CreateAssetBody,
  type FlagMaintenanceBody,
  type ReleaseAssetBody,
  type ReturnAssetBody,
  type UpdateAssetBody,
} from "./asset.validation";

function isPgUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code: unknown }).code) === "23505"
  );
}

function toDateString(value: Date | string): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

function parseValue(value: string | null): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeMaintenanceHistory(
  value: MaintenanceLogEntry[] | null | undefined
): MaintenanceLogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
}

/**
 * Maps a DB row → the exact frontend `Asset` contract so React Query hooks
 * and UI components can consume responses without adapters at integration time.
 */
export function toAssetDTO(row: AssetRow): Asset {
  return {
    id: row.id,
    assetCode: row.assetCode,
    name: row.name,
    category: row.category,
    status: row.status,
    assignmentType: row.assignmentType,
    serialNumber: row.serialNumber ?? undefined,
    location: row.location,
    currentHolder: row.currentHolder ?? undefined,
    department: row.department ?? undefined,
    purchaseDate: row.purchaseDate ?? undefined,
    value: parseValue(row.value),
    supplierId: row.supplierId ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    notes: row.notes ?? undefined,
    lastUpdated: toDateString(row.lastUpdated),
    maintenanceHistory: normalizeMaintenanceHistory(row.maintenanceHistory),
  };
}

const TRACKED_UPDATE_FIELDS: (keyof AssetRow)[] = [
  "assetCode",
  "name",
  "category",
  "status",
  "serialNumber",
  "location",
  "currentHolder",
  "department",
  "purchaseDate",
  "value",
  "supplierId",
  "imageUrl",
  "notes",
];

export class AssetService {
  constructor(
    private readonly assetRepository: AssetRepository = new AssetRepository(),
    private readonly lifecycleService: AssetLifecycleService = new AssetLifecycleService(),
    private readonly borrowLogs: BorrowLogService = new BorrowLogService(),
    private readonly borrowLogRepo: BorrowLogRepository = new BorrowLogRepository(),
    private readonly maintenanceRepo: MaintenanceRepository = new MaintenanceRepository(),
    private readonly purchaseLots: PurchaseLotService = new PurchaseLotService(),
    private readonly suppliers: SupplierRepository = new SupplierRepository()
  ) {}

  async listAssets(rawQuery: unknown): Promise<Asset[]> {
    const filters: ListAssetsFilters = listAssetsQuerySchema.parse(rawQuery ?? {});
    const rows = await this.assetRepository.findMany(filters);
    return rows.map(toAssetDTO);
  }

  async getAssetById(rawId: string): Promise<Asset> {
    const id = assetIdSchema.parse(rawId);
    const row = await this.assetRepository.findById(id);

    if (!row) {
      throw new NotFoundError("Asset", id);
    }

    return toAssetDTO(row);
  }

  async createAsset(rawInput: unknown, actor: ActorContext): Promise<Asset> {
    const input: CreateAssetBody = createAssetSchema.parse(rawInput);

    if (input.supplierId) {
      const supplier = await this.suppliers.findById(input.supplierId);
      if (!supplier || supplier.status !== "active") {
        throw new NotFoundError("Supplier", input.supplierId);
      }
    }

    try {
      return await withTransaction(async (tx) => {
        const now = new Date();
        const row = await this.assetRepository.create(
          {
            assetCode: input.assetCode,
            name: input.name,
            category: input.category,
            status: input.status ?? "active",
            location: input.location,
            serialNumber: input.serialNumber ?? null,
            currentHolder: input.currentHolder ?? null,
            department: input.department ?? null,
            purchaseDate: input.purchaseDate ?? null,
            value: input.value !== undefined ? input.value.toFixed(2) : null,
            supplierId: input.supplierId ?? null,
            imageUrl: input.imageUrl ?? null,
            notes: input.notes ?? null,
            maintenanceHistory: [],
            lastUpdated: now,
          },
          tx
        );

        await this.lifecycleService.record(
          {
            assetId: row.id,
            assetCode: row.assetCode,
            eventType: "created",
            actor,
            toStatus: row.status,
            toHolder: row.currentHolder,
            payload: {
              snapshot: {
                name: row.name,
                category: row.category,
                location: row.location,
              },
            },
          },
          tx
        );

        // Record acquisition cost history when unit value is known.
        if (input.value !== undefined) {
          await this.purchaseLots.recordLot(
            {
              itemType: "asset",
              assetId: row.id,
              itemCode: row.assetCode,
              itemName: row.name,
              supplierId: input.supplierId ?? null,
              quantity: 1,
              unitCost: input.value.toFixed(2),
              purchasedOn: input.purchaseDate ?? todayDateString(),
              notes: input.notes ?? null,
              recordedByUserId: actor.userId,
              recordedByName: actor.displayName,
            },
            tx
          );
        }

        return toAssetDTO(row);
      });
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        throw new ConflictError("Asset code already exists.");
      }
      throw error;
    }
  }

  async updateAsset(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<Asset> {
    const id = assetIdSchema.parse(rawId);
    const input: UpdateAssetBody = updateAssetSchema.parse(rawInput);

    const existing = await this.assetRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    // Custody field is not patchable — only release/return may change holder.
    if (input.currentHolder !== undefined) {
      throw new ConflictError(
        "currentHolder cannot be set via asset update. Use release/return so the custody ledger is updated."
      );
    }

    try {
      const updated = await this.assetRepository.update(id, {
        ...(input.assetCode !== undefined ? { assetCode: input.assetCode } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.assignmentType !== undefined ? { assignmentType: input.assignmentType } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.serialNumber !== undefined
          ? { serialNumber: input.serialNumber }
          : {}),
        ...(input.department !== undefined ? { department: input.department } : {}),
        ...(input.purchaseDate !== undefined
          ? { purchaseDate: input.purchaseDate }
          : {}),
        ...(input.value !== undefined ? { value: input.value.toFixed(2) } : {}),
        ...(input.supplierId !== undefined
          ? { supplierId: input.supplierId }
          : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        lastUpdated: new Date(),
      });

      if (!updated) {
        throw new NotFoundError("Asset", id);
      }

      const changes = buildAssetFieldChanges(
        existing,
        updated,
        TRACKED_UPDATE_FIELDS
      );

      if (Object.keys(changes).length > 0) {
        await this.lifecycleService.record({
          assetId: updated.id,
          assetCode: updated.assetCode,
          eventType: "updated",
          actor,
          fromStatus: existing.status,
          toStatus: updated.status,
          fromHolder: existing.currentHolder,
          toHolder: updated.currentHolder,
          payload: { changes },
        });

        if (existing.status !== updated.status) {
          await this.lifecycleService.record({
            assetId: updated.id,
            assetCode: updated.assetCode,
            eventType: "status_changed",
            actor,
            fromStatus: existing.status,
            toStatus: updated.status,
            payload: {
              via: "update",
            },
          });
        }
      }

      return toAssetDTO(updated);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (isPgUniqueViolation(error)) {
        throw new ConflictError("Asset code already exists.");
      }
      throw error;
    }
  }

  async deleteAsset(rawId: string, actor: ActorContext): Promise<void> {
    const id = assetIdSchema.parse(rawId);
    const existing = await this.assetRepository.findById(id);

    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    const open = await this.borrowLogRepo.findActiveByAssetId(id);
    if (open || existing.currentHolder) {
      throw new ConflictError(
        "Cannot delete an asset that is currently checked out. Return it first."
      );
    }

    // Record first — history survives FK set-null after delete.
    await this.lifecycleService.record({
      assetId: existing.id,
      assetCode: existing.assetCode,
      eventType: "deleted",
      actor,
      fromStatus: existing.status,
      fromHolder: existing.currentHolder,
      payload: {
        snapshot: {
          name: existing.name,
          category: existing.category,
          location: existing.location,
        },
      },
    });

    const deleted = await this.assetRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("Asset", id);
    }
  }

  /**
   * Accountability path: delegates to BorrowLogService (log + holder + lifecycle in one TX).
   * Prefer this or POST /api/borrow-log — they share the same custody ledger.
   */
  async releaseAsset(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<Asset> {
    const id = assetIdSchema.parse(rawId);
    const input: ReleaseAssetBody = releaseAssetSchema.parse(rawInput ?? {});
    const existing = await this.assetRepository.findById(id);

    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    await this.borrowLogs.release(
      {
        assetId: id,
        borrowerName: input.borrowerName,
        borrowerEmail: input.borrowerEmail ?? "",
        borrowerPhone: input.borrowerPhone ?? "",
        department:
          input.borrowerDepartment?.trim() ||
          existing.department?.trim() ||
          "Unassigned",
        dueDate: input.expectedReturnDate ?? this.borrowLogs.defaultDueDate(),
        notes: input.notes,
        requestId: input.requestId,
      },
      actor
    );

    return this.getAssetById(id);
  }

  /**
   * Returns via active borrow log (required). No holder-only side updates.
   */
  async returnAsset(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<Asset> {
    const id = assetIdSchema.parse(rawId);
    const input: ReturnAssetBody = returnAssetSchema.parse(rawInput);

    const existing = await this.assetRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    const open = await this.borrowLogRepo.findActiveByAssetId(id);
    if (!open) {
      throw new ConflictError(
        "No active borrow log for this asset. Use the borrow return path to keep the custody ledger consistent."
      );
    }

    const conditionKey = input.condition.trim().toLowerCase().replace(/\s+/g, "_");
    const condition =
      conditionKey === "good" ||
      conditionKey === "damaged" ||
      conditionKey === "needs_repair"
        ? (conditionKey as "good" | "damaged" | "needs_repair")
        : "good";

    const flagMaintenance =
      input.flagMaintenance ||
      input.status === "needs_repair" ||
      conditionKey === "needs_repair" ||
      conditionKey === "damaged";

    await this.borrowLogs.returnLog(
      open.id,
      {
        condition,
        conditionNotes:
          condition === conditionKey ? undefined : input.condition,
        flagMaintenance,
      },
      actor
    );

    // Optional explicit status override after return (rare)
    if (input.status && input.status !== "needs_repair") {
      const after = await this.assetRepository.findById(id);
      if (after && after.status !== input.status) {
        await this.assetRepository.update(id, {
          status: input.status,
          lastUpdated: new Date(),
        });
        await this.lifecycleService.record({
          assetId: id,
          assetCode: existing.assetCode,
          eventType: "status_changed",
          actor,
          fromStatus: after.status,
          toStatus: input.status,
          payload: { via: "return_status_override" },
        });
      }
    }

    return this.getAssetById(id);
  }

  /**
   * Flag maintenance: asset status + embedded history + first-class maintenance log + ledger (atomic).
   */
  async flagForMaintenance(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<Asset> {
    const id = assetIdSchema.parse(rawId);
    const input: FlagMaintenanceBody = flagMaintenanceSchema.parse(rawInput ?? {});

    const updated = await withTransaction(async (tx) => {
      const existing = await this.assetRepository.findByIdForUpdate(id, tx);
      if (!existing) {
        throw new NotFoundError("Asset", id);
      }

      if (existing.status === "retired") {
        throw new ConflictError("Retired assets cannot be flagged for maintenance.");
      }

      if (existing.currentHolder) {
        throw new ConflictError(
          "Asset is currently released. Return it (with repair condition) instead of flagging in isolation."
        );
      }

      const description =
        input.description?.trim() ||
        "Flagged for maintenance inspection by Property Custodian.";

      const entry: MaintenanceLogEntry = {
        id: crypto.randomUUID(),
        date: todayDateString(),
        type: "flagged",
        description,
        technician: actor.displayName,
      };

      const history = normalizeMaintenanceHistory(existing.maintenanceHistory);
      const next = await this.assetRepository.update(
        id,
        {
          status: "needs_repair",
          maintenanceHistory: [...history, entry],
          lastUpdated: new Date(),
        },
        tx
      );
      if (!next) throw new NotFoundError("Asset", id);

      const mntCode = generateOperationalCode("MNT");
      await this.maintenanceRepo.create(
        {
          logCode: mntCode,
          assetId: next.id,
          assetCode: next.assetCode,
          assetName: next.name,
          category: next.category,
          condition: "needs_maintenance",
          source: "manual_flag",
          dateLogged: todayDateString(),
          loggedByUserId: actor.userId,
          loggedByName: actor.displayName,
          notes: [description, input.notes].filter(Boolean).join(" — "),
          isResolved: false,
          resolutionDate: null,
          resolutionNotes: null,
          resolvedByUserId: null,
          resolvedByName: null,
          relatedBorrowLogCode: null,
          scheduledDate: null,
        },
        tx
      );

      await this.lifecycleService.record(
        {
          assetId: next.id,
          assetCode: next.assetCode,
          eventType: "flagged_maintenance",
          actor,
          fromStatus: existing.status,
          toStatus: next.status,
          fromHolder: existing.currentHolder,
          toHolder: next.currentHolder,
          payload: {
            description,
            notes: input.notes ?? null,
            maintenanceEntryId: entry.id,
            maintenanceLogCode: mntCode,
          },
        },
        tx
      );

      if (existing.status !== next.status) {
        await this.lifecycleService.record(
          {
            assetId: next.id,
            assetCode: next.assetCode,
            eventType: "status_changed",
            actor,
            fromStatus: existing.status,
            toStatus: next.status,
            payload: { via: "flagged_maintenance", maintenanceLogCode: mntCode },
          },
          tx
        );
      }

      return next;
    });

    return toAssetDTO(updated);
  }

  async listLifecycle(assetId: string, limit?: number) {
    const id = assetIdSchema.parse(assetId);
    const existing = await this.assetRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Asset", id);
    }
    return this.lifecycleService.listForAsset(id, limit);
  }
}
