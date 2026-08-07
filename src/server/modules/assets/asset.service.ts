import type { Asset, MaintenanceLogEntry } from "@/types/assets";
import type { AssetRow } from "@/server/db/schema";
import {
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";
import type { ActorContext } from "@/server/shared/auth";

import { CHECKED_OUT_PLACEHOLDER } from "./asset.constants";
import { AssetLifecycleService } from "./asset.lifecycle.service";
import { buildAssetFieldChanges } from "./asset.lifecycle.types";
import { AssetRepository } from "./asset.repository";
import type { IAssetRepository, ListAssetsFilters } from "./asset.types";
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
    serialNumber: row.serialNumber ?? undefined,
    location: row.location,
    currentHolder: row.currentHolder ?? undefined,
    department: row.department ?? undefined,
    purchaseDate: row.purchaseDate ?? undefined,
    value: parseValue(row.value),
    imageUrl: row.imageUrl ?? undefined,
    notes: row.notes ?? undefined,
    lastUpdated: toDateString(row.lastUpdated),
    maintenanceHistory: normalizeMaintenanceHistory(row.maintenanceHistory),
  };
}

function isAvailableForRelease(row: AssetRow): boolean {
  return row.status === "active" && !row.currentHolder;
}

function isBorrowed(row: AssetRow): boolean {
  return Boolean(row.currentHolder);
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
  "imageUrl",
  "notes",
];

export class AssetService {
  constructor(
    private readonly assetRepository: IAssetRepository = new AssetRepository(),
    private readonly lifecycleService: AssetLifecycleService = new AssetLifecycleService()
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

    try {
      const now = new Date();
      const row = await this.assetRepository.create({
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
        imageUrl: input.imageUrl ?? null,
        notes: input.notes ?? null,
        maintenanceHistory: [],
        lastUpdated: now,
      });

      await this.lifecycleService.record({
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
      });

      return toAssetDTO(row);
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

    try {
      const updated = await this.assetRepository.update(id, {
        ...(input.assetCode !== undefined ? { assetCode: input.assetCode } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.serialNumber !== undefined
          ? { serialNumber: input.serialNumber }
          : {}),
        ...(input.currentHolder !== undefined
          ? { currentHolder: input.currentHolder }
          : {}),
        ...(input.department !== undefined ? { department: input.department } : {}),
        ...(input.purchaseDate !== undefined
          ? { purchaseDate: input.purchaseDate }
          : {}),
        ...(input.value !== undefined ? { value: input.value.toFixed(2) } : {}),
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
   * Checks out an available active asset to a borrower.
   * Records staff actor (who released) and borrower identity separately.
   */
  async releaseAsset(rawId: string, rawInput: unknown, actor: ActorContext): Promise<Asset> {
    const id = assetIdSchema.parse(rawId);
    const input: ReleaseAssetBody = releaseAssetSchema.parse(rawInput ?? {});
    const existing = await this.assetRepository.findById(id);

    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    if (!isAvailableForRelease(existing)) {
      throw new ConflictError("Asset is not available for release.");
    }

    const holder =
      input.borrowerName?.trim() ||
      input.borrowerDepartment?.trim() ||
      CHECKED_OUT_PLACEHOLDER;

    const updated = await this.assetRepository.update(id, {
      currentHolder: holder,
      department: input.borrowerDepartment ?? existing.department,
      lastUpdated: new Date(),
    });

    if (!updated) {
      throw new NotFoundError("Asset", id);
    }

    await this.lifecycleService.record({
      assetId: updated.id,
      assetCode: updated.assetCode,
      eventType: "released",
      actor,
      fromStatus: existing.status,
      toStatus: updated.status,
      fromHolder: existing.currentHolder,
      toHolder: updated.currentHolder,
      payload: {
        borrowerName: input.borrowerName ?? null,
        borrowerDepartment: input.borrowerDepartment ?? null,
        notes: input.notes ?? null,
        expectedReturnDate: input.expectedReturnDate ?? null,
      },
    });

    return toAssetDTO(updated);
  }

  /**
   * Clears the current holder and records return condition.
   * Optional status lets the custodian flag needs_repair on return.
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

    if (!isBorrowed(existing)) {
      throw new ConflictError("Only borrowed assets can be returned.");
    }

    const previousHolder = existing.currentHolder;
    const conditionNote = `Returned: ${input.condition}`;
    const nextNotes = existing.notes
      ? `${existing.notes}\n${conditionNote}`
      : conditionNote;
    const nextStatus = input.status ?? existing.status;

    const updated = await this.assetRepository.update(id, {
      currentHolder: null,
      status: nextStatus,
      notes: nextNotes,
      lastUpdated: new Date(),
    });

    if (!updated) {
      throw new NotFoundError("Asset", id);
    }

    await this.lifecycleService.record({
      assetId: updated.id,
      assetCode: updated.assetCode,
      eventType: "returned",
      actor,
      fromStatus: existing.status,
      toStatus: updated.status,
      fromHolder: previousHolder,
      toHolder: null,
      payload: {
        condition: input.condition,
      },
    });

    if (existing.status !== updated.status) {
      await this.lifecycleService.record({
        assetId: updated.id,
        assetCode: updated.assetCode,
        eventType: "status_changed",
        actor,
        fromStatus: existing.status,
        toStatus: updated.status,
        payload: { via: "return" },
      });
    }

    return toAssetDTO(updated);
  }

  /**
   * Flag for maintenance — explicit custodial action with ledger entry
   * and a maintenanceHistory entry on the asset (until maintenance_logs land).
   */
  async flagForMaintenance(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<Asset> {
    const id = assetIdSchema.parse(rawId);
    const input: FlagMaintenanceBody = flagMaintenanceSchema.parse(rawInput ?? {});
    const existing = await this.assetRepository.findById(id);

    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    if (existing.status === "retired") {
      throw new ConflictError("Retired assets cannot be flagged for maintenance.");
    }

    const description =
      input.description?.trim() ||
      "Flagged for maintenance inspection by Property Custodian.";

    const entry: MaintenanceLogEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      type: "flagged",
      description,
      technician: actor.displayName,
    };

    const history = normalizeMaintenanceHistory(existing.maintenanceHistory);

    const updated = await this.assetRepository.update(id, {
      status: "needs_repair",
      maintenanceHistory: [...history, entry],
      lastUpdated: new Date(),
    });

    if (!updated) {
      throw new NotFoundError("Asset", id);
    }

    await this.lifecycleService.record({
      assetId: updated.id,
      assetCode: updated.assetCode,
      eventType: "flagged_maintenance",
      actor,
      fromStatus: existing.status,
      toStatus: updated.status,
      fromHolder: existing.currentHolder,
      toHolder: updated.currentHolder,
      payload: {
        description,
        notes: input.notes ?? null,
        maintenanceEntryId: entry.id,
      },
    });

    if (existing.status !== updated.status) {
      await this.lifecycleService.record({
        assetId: updated.id,
        assetCode: updated.assetCode,
        eventType: "status_changed",
        actor,
        fromStatus: existing.status,
        toStatus: updated.status,
        payload: { via: "flagged_maintenance" },
      });
    }

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
