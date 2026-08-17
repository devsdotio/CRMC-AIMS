import type { Asset, MaintenanceLogEntry } from "@/types/assets";
import type { AssetModelRow, AssetRow } from "@/server/db/schema";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";
import type { ActorContext } from "@/server/shared/auth";
import { generateOperationalCode, todayDateString } from "@/server/shared/codes";
import { parseScanPayload } from "@/server/shared/qr";
import { withTransaction, type DbSession } from "@/server/db/transaction";
import { BorrowLogService } from "@/server/modules/borrow-log/borrow-log.service";
import { BorrowLogRepository } from "@/server/modules/borrow-log/borrow-log.repository";
import { MaintenanceRepository } from "@/server/modules/maintenance/maintenance.repository";
import { PurchaseLotService } from "@/server/modules/purchase-lots/purchase-lot.service";
import { SupplierRepository } from "@/server/modules/suppliers/supplier.repository";
import { ProjectAssetAssignmentRepository } from "@/server/modules/projects/project-asset.repository";
import { CategoryRepository } from "@/server/modules/categories/category.repository";

import { AssetLifecycleService } from "./asset.lifecycle.service";
import { buildAssetFieldChanges } from "./asset.lifecycle.types";
import {
  AssetModelService,
  toAssetModelDTO,
  type AssetModelDTO,
  type BulkUnitsResult,
} from "./asset.model.service";
import {
  bulkCreateAssetsSchema,
  scanReleaseAssetSchema,
  scanReturnAssetSchema,
  type BulkCreateAssetsBody,
  type ScanReleaseAssetBody,
  type ScanReturnAssetBody,
} from "./asset.model.validation";
import { AssetRepository } from "./asset.repository";
import type { AssetDTOWithMeta, ListAssetsFilters } from "./asset.types";
import { withAssetMeta } from "./asset.types";
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

function padSeq(n: number, width = 3): string {
  return String(n).padStart(width, "0");
}

/**
 * Maps a DB row → the frontend `Asset` contract (+ QR payload / model link).
 */
export function toAssetDTO(row: AssetRow): AssetDTOWithMeta {
  const base: Asset & { modelId?: string } = {
    id: row.id,
    assetCode: row.assetCode,
    name: row.name,
    category: row.category,
    status: row.status,
    assignmentType: row.assignmentType,
    modelId: row.modelId ?? undefined,
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
  return withAssetMeta(base);
}

export type AssetScanResolveDTO = {
  kind: "asset";
  code: string;
  qrPayload: string;
  asset: AssetDTOWithMeta;
  suggestedAction: "release" | "return" | "project" | "blocked";
  reason?: string;
};

const TRACKED_UPDATE_FIELDS: (keyof AssetRow)[] = [
  "assetCode",
  "name",
  "category",
  "status",
  "assignmentType",
  "modelId",
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
    private readonly suppliers: SupplierRepository = new SupplierRepository(),
    private readonly projectAssignments: ProjectAssetAssignmentRepository = new ProjectAssetAssignmentRepository(),
    private readonly taxonomy: CategoryRepository = new CategoryRepository(),
    private readonly models: AssetModelService = new AssetModelService()
  ) {}

  private async resolveAssetCategoryName(rawName: string): Promise<string> {
    const found = await this.taxonomy.findByTypeAndName("asset", rawName);
    if (!found) {
      throw new BadRequestError(
        `Unknown asset category “${rawName}”. Add it under Settings → Categories first.`
      );
    }
    return found.name;
  }

  async listAssets(rawQuery: unknown): Promise<AssetDTOWithMeta[]> {
    const filters: ListAssetsFilters = listAssetsQuerySchema.parse(rawQuery ?? {});
    const rows = await this.assetRepository.findMany(filters);
    return rows.map(toAssetDTO);
  }

  async getAssetById(rawId: string): Promise<AssetDTOWithMeta> {
    const id = assetIdSchema.parse(rawId);
    const row = await this.assetRepository.findById(id);

    if (!row) {
      throw new NotFoundError("Asset", id);
    }

    return toAssetDTO(row);
  }

  async getAssetByCode(rawCode: string): Promise<AssetDTOWithMeta> {
    const parsed = parseScanPayload(rawCode);
    if (!parsed.code) {
      throw new BadRequestError("Asset code is required.");
    }
    const row = await this.assetRepository.findByAssetCode(parsed.code);
    if (!row) {
      throw new NotFoundError("Asset", parsed.code);
    }
    return toAssetDTO(row);
  }

  async listUnitsForModel(rawModelId: string): Promise<AssetDTOWithMeta[]> {
    const model = await this.models.requireModel(rawModelId);
    const rows = await this.assetRepository.findByModelId(model.id);
    return rows.map(toAssetDTO);
  }

  async resolveScan(rawCode: string): Promise<AssetScanResolveDTO> {
    const asset = await this.getAssetByCode(rawCode);
    const openBorrow = await this.borrowLogRepo.findActiveByAssetId(asset.id);
    const openProject = await this.projectAssignments.findOpenByAssetId(
      asset.id
    );

    if (openProject) {
      return {
        kind: "asset",
        code: asset.assetCode,
        qrPayload: asset.qrPayload,
        asset,
        suggestedAction: "project",
        reason:
          "Asset is assigned to a project. Use the project panel for return / damage.",
      };
    }

    if (openBorrow || asset.currentHolder) {
      return {
        kind: "asset",
        code: asset.assetCode,
        qrPayload: asset.qrPayload,
        asset,
        suggestedAction: "return",
        reason: asset.currentHolder
          ? `Currently held by ${asset.currentHolder}.`
          : "Open borrow log found.",
      };
    }

    if (asset.assignmentType === "assignable") {
      return {
        kind: "asset",
        code: asset.assetCode,
        qrPayload: asset.qrPayload,
        asset,
        suggestedAction: "project",
        reason:
          "Assignable asset — assign via a project, not the borrow release flow.",
      };
    }

    if (asset.status !== "active") {
      return {
        kind: "asset",
        code: asset.assetCode,
        qrPayload: asset.qrPayload,
        asset,
        suggestedAction: "blocked",
        reason: `Asset status is “${asset.status}” and cannot be released.`,
      };
    }

    return {
      kind: "asset",
      code: asset.assetCode,
      qrPayload: asset.qrPayload,
      asset,
      suggestedAction: "release",
      reason: "Available for release to a borrower.",
    };
  }

  async createAsset(
    rawInput: unknown,
    actor: ActorContext
  ): Promise<AssetDTOWithMeta> {
    const input: CreateAssetBody = createAssetSchema.parse(rawInput);
    const categoryName = await this.resolveAssetCategoryName(input.category);

    if (input.supplierId) {
      const supplier = await this.suppliers.findById(input.supplierId);
      if (!supplier || supplier.status !== "active") {
        throw new NotFoundError("Supplier", input.supplierId);
      }
    }

    if (input.modelId) {
      await this.models.requireModel(input.modelId);
    }

    try {
      return await withTransaction(async (tx) => {
        const now = new Date();
        const row = await this.assetRepository.create(
          {
            assetCode: input.assetCode,
            name: input.name,
            category: categoryName,
            status: input.status ?? "active",
            assignmentType: input.assignmentType ?? "borrowable",
            modelId: input.modelId ?? null,
            location: input.location,
            serialNumber: input.serialNumber ?? null,
            // Custody only via release / project assign — never invent a holder on create.
            currentHolder: null,
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
                modelId: row.modelId,
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

  /**
   * One-shot: catalog model + N individually coded/QR units.
   * Scenario: "Epson 310 Printer" × 30 pieces.
   */
  async bulkCreate(
    rawInput: unknown,
    actor: ActorContext
  ): Promise<BulkUnitsResult> {
    const input: BulkCreateAssetsBody = bulkCreateAssetsSchema.parse(rawInput);
    const categoryName = await this.resolveAssetCategoryName(input.category);

    if (input.supplierId) {
      const supplier = await this.suppliers.findById(input.supplierId);
      if (!supplier || supplier.status !== "active") {
        throw new NotFoundError("Supplier", input.supplierId);
      }
    }

    return withTransaction(async (tx) => {
      const modelRow = await this.models.repository.create({
        modelCode: input.modelCode,
        name: input.name,
        category: categoryName,
        description: input.description ?? null,
        manufacturer: input.manufacturer ?? null,
        defaultAssignmentType: input.assignmentType ?? "borrowable",
        defaultLocation: input.location,
        defaultUnitValue:
          input.unitValue !== undefined
            ? input.unitValue.toFixed(2)
            : input.defaultUnitValue !== undefined
              ? input.defaultUnitValue.toFixed(2)
              : null,
        imageUrl: input.imageUrl ?? null,
        notes: input.notes ?? null,
        createdByUserId: actor.userId,
        createdByName: actor.displayName,
      });

      const units = await this.mintUnits(
        {
          model: modelRow,
          quantity: input.quantity,
          codePrefix: input.codePrefix ?? input.modelCode,
          location: input.location,
          assignmentType: input.assignmentType ?? "borrowable",
          department: input.department,
          purchaseDate: input.purchaseDate,
          unitValue: input.unitValue,
          supplierId: input.supplierId,
          notes: input.notes,
          serialNumbers: input.serialNumbers,
        },
        actor,
        tx
      );

      return {
        model: toAssetModelDTO(modelRow, units.length, units.length),
        units,
        createdCount: units.length,
      };
    });
  }

  /** Add more physical units under an existing model. */
  async registerUnits(
    rawModelId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<BulkUnitsResult> {
    const model = await this.models.requireModel(rawModelId);
    const input = this.models.parseBulkUnits(rawInput);
    this.models.assertSerials(input.quantity, input.serialNumbers);

    if (input.supplierId) {
      const supplier = await this.suppliers.findById(input.supplierId);
      if (!supplier || supplier.status !== "active") {
        throw new NotFoundError("Supplier", input.supplierId);
      }
    }

    const location =
      input.location ?? model.defaultLocation ?? null;
    if (!location?.trim()) {
      throw new BadRequestError(
        "location is required when registering units (set model defaultLocation or pass location)."
      );
    }

    return withTransaction(async (tx) => {
      const units = await this.mintUnits(
        {
          model,
          quantity: input.quantity,
          codePrefix: input.codePrefix ?? model.modelCode,
          location,
          assignmentType:
            input.assignmentType ?? model.defaultAssignmentType ?? "borrowable",
          department: input.department,
          purchaseDate: input.purchaseDate,
          unitValue:
            input.unitValue ??
            (model.defaultUnitValue != null
              ? Number(model.defaultUnitValue)
              : undefined),
          supplierId: input.supplierId,
          notes: input.notes,
          serialNumbers: input.serialNumbers,
        },
        actor,
        tx
      );

      const unitCount = await this.models.repository.countUnits(model.id, tx);
      const availableCount = await this.models.repository.countAvailableUnits(
        model.id,
        tx
      );

      return {
        model: toAssetModelDTO(model, unitCount, availableCount),
        units,
        createdCount: units.length,
      };
    });
  }

  private async mintUnits(
    args: {
      model: AssetModelRow;
      quantity: number;
      codePrefix: string;
      location: string;
      assignmentType: "borrowable" | "assignable";
      department?: string;
      purchaseDate?: string;
      unitValue?: number;
      supplierId?: string | null;
      notes?: string;
      serialNumbers?: string[];
    },
    actor: ActorContext,
    tx: DbSession
  ): Promise<AssetDTOWithMeta[]> {
    const startSeq =
      (await this.models.repository.maxUnitSequenceForPrefix(
        args.codePrefix,
        tx
      )) + 1;

    const created: AssetDTOWithMeta[] = [];
    const now = new Date();

    for (let i = 0; i < args.quantity; i++) {
      const seq = startSeq + i;
      const assetCode = `${args.codePrefix}-${padSeq(seq)}`;
      const serial = args.serialNumbers?.[i]?.trim() || null;

      try {
        const row = await this.assetRepository.create(
          {
            assetCode,
            name: args.model.name,
            category: args.model.category,
            status: "active",
            assignmentType: args.assignmentType,
            modelId: args.model.id,
            location: args.location,
            serialNumber: serial,
            currentHolder: null,
            department: args.department ?? null,
            purchaseDate: args.purchaseDate ?? null,
            value:
              args.unitValue !== undefined
                ? args.unitValue.toFixed(2)
                : args.model.defaultUnitValue,
            supplierId: args.supplierId ?? null,
            imageUrl: args.model.imageUrl,
            notes: args.notes ?? args.model.notes,
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
            toHolder: null,
            payload: {
              snapshot: {
                name: row.name,
                category: row.category,
                location: row.location,
                modelId: row.modelId,
                bulk: true,
                sequence: seq,
              },
            },
          },
          tx
        );

        if (args.unitValue !== undefined) {
          await this.purchaseLots.recordLot(
            {
              itemType: "asset",
              assetId: row.id,
              itemCode: row.assetCode,
              itemName: row.name,
              supplierId: args.supplierId ?? null,
              quantity: 1,
              unitCost: args.unitValue.toFixed(2),
              purchasedOn: args.purchaseDate ?? todayDateString(),
              notes: args.notes ?? null,
              recordedByUserId: actor.userId,
              recordedByName: actor.displayName,
            },
            tx
          );
        }

        created.push(toAssetDTO(row));
      } catch (error) {
        if (isPgUniqueViolation(error)) {
          throw new ConflictError(
            `Asset code ${assetCode} already exists. Choose another codePrefix.`
          );
        }
        throw error;
      }
    }

    return created;
  }

  async updateAsset(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<AssetDTOWithMeta> {
    const id = assetIdSchema.parse(rawId);
    const input: UpdateAssetBody = updateAssetSchema.parse(rawInput);

    const existing = await this.assetRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    if (input.supplierId) {
      const supplier = await this.suppliers.findById(input.supplierId);
      if (!supplier || supplier.status !== "active") {
        throw new NotFoundError("Supplier", input.supplierId);
      }
    }

    if (input.modelId) {
      await this.models.requireModel(input.modelId);
    }

    let categoryName: string | undefined;
    if (input.category !== undefined) {
      categoryName = await this.resolveAssetCategoryName(input.category);
    }

    try {
      const updated = await this.assetRepository.update(id, {
        ...(input.assetCode !== undefined ? { assetCode: input.assetCode } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(categoryName !== undefined ? { category: categoryName } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.assignmentType !== undefined ? { assignmentType: input.assignmentType } : {}),
        ...(input.modelId !== undefined ? { modelId: input.modelId } : {}),
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
    const openProject = await this.projectAssignments.findOpenByAssetId(id);
    if (open || openProject || existing.currentHolder) {
      throw new ConflictError(
        "Cannot delete an asset that is currently checked out or assigned to a project. Return it first."
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
          modelId: existing.modelId,
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
  ): Promise<AssetDTOWithMeta> {
    const id = assetIdSchema.parse(rawId);
    const input: ReleaseAssetBody = releaseAssetSchema.parse(rawInput ?? {});
    const existing = await this.assetRepository.findById(id);

    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    const custodyKind =
      input.custodyKind ??
      (existing.assignmentType === "assignable" ? "assignment" : "borrow");

    if (custodyKind === "borrow" && existing.assignmentType !== "borrowable") {
      throw new BadRequestError(
        "This asset is assignable. Use assignment custody with a department or project destination."
      );
    }
    if (custodyKind === "assignment" && existing.assignmentType !== "assignable") {
      throw new BadRequestError(
        "This asset is borrowable. Use a due-dated borrow release instead."
      );
    }

    await this.borrowLogs.release(
      {
        assetId: id,
        custodyKind,
        source: "admin_manual",
        departmentId: input.departmentId,
        projectId: input.projectId,
        borrowerName: input.borrowerName,
        borrowerEmail: input.borrowerEmail ?? "",
        borrowerPhone: input.borrowerPhone ?? "",
        dueDate:
          custodyKind === "borrow"
            ? (input.expectedReturnDate ?? this.borrowLogs.defaultDueDate())
            : null,
        requestedByName: input.requestedByName,
        notes: input.notes,
        requestId: input.requestId,
      },
      actor
    );

    return this.getAssetById(id);
  }

  /** Operator scan → release (QR payload or bare asset code). */
  async scanRelease(
    rawInput: unknown,
    actor: ActorContext
  ): Promise<AssetDTOWithMeta> {
    const input: ScanReleaseAssetBody = scanReleaseAssetSchema.parse(rawInput);
    const asset = await this.getAssetByCode(input.code);
    const { code: _code, ...releaseBody } = input;
    return this.releaseAsset(asset.id, releaseBody, actor);
  }

  /**
   * Returns via active borrow log (required). No holder-only side updates.
   */
  async returnAsset(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<AssetDTOWithMeta> {
    const id = assetIdSchema.parse(rawId);
    const input: ReturnAssetBody = returnAssetSchema.parse(rawInput);

    const existing = await this.assetRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    const open = await this.borrowLogRepo.findActiveByAssetId(id);
    if (!open) {
      const projectOpen = await this.projectAssignments.findOpenByAssetId(id);
      if (projectOpen) {
        throw new ConflictError(
          "This asset is assigned to a project. Return it from the project detail panel (Assigned assets), not the borrow return API."
        );
      }
      if (existing.currentHolder) {
        throw new ConflictError(
          `Asset shows holder “${existing.currentHolder}” but has no active borrow log. Return via the project assignment or fix the custody record.`
        );
      }
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

  /** Operator scan → receive/return (QR payload or bare asset code). */
  async scanReturn(
    rawInput: unknown,
    actor: ActorContext
  ): Promise<AssetDTOWithMeta> {
    const input: ScanReturnAssetBody = scanReturnAssetSchema.parse(rawInput);
    const asset = await this.getAssetByCode(input.code);
    const { code: _code, ...returnBody } = input;
    return this.returnAsset(asset.id, returnBody, actor);
  }

  /**
   * Flag maintenance: asset status + embedded history + first-class maintenance log + ledger (atomic).
   */
  async flagForMaintenance(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<AssetDTOWithMeta> {
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
        const projectOpen = await this.projectAssignments.findOpenByAssetId(id);
        if (projectOpen) {
          throw new ConflictError(
            "Asset is on a project. Use Report damage on the project panel to flag repair or write off while in project custody."
          );
        }
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

export type { AssetModelDTO, BulkUnitsResult };
