import type { MaintenanceLogRow } from "@/server/db/schema";
import { formatSequentialCode, todayDateString } from "@/server/shared/codes";
import type { ActorContext } from "@/server/shared/auth";
import {
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";
import { AssetRepository } from "@/server/modules/assets/asset.repository";
import { AssetLifecycleService } from "@/server/modules/assets/asset.lifecycle.service";

import { MaintenanceRepository } from "./maintenance.repository";
import type {
  IMaintenanceRepository,
  MaintenanceLogDTO,
} from "./maintenance.types";
import {
  createMaintenanceSchema,
  listMaintenanceQuerySchema,
  maintenanceIdSchema,
  resolveMaintenanceSchema,
} from "./maintenance.validation";

function toDTO(row: MaintenanceLogRow): MaintenanceLogDTO {
  return {
    id: row.id,
    logCode: row.logCode,
    assetCode: row.assetCode,
    assetName: row.assetName,
    category: row.category,
    condition: row.condition,
    source: row.source,
    dateLogged: row.dateLogged,
    loggedBy: row.loggedByName,
    notes: row.notes,
    isResolved: row.isResolved,
    resolutionDate: row.resolutionDate ?? undefined,
    resolutionNotes: row.resolutionNotes ?? undefined,
    resolvedBy: row.resolvedByName ?? undefined,
    relatedBorrowLogCode: row.relatedBorrowLogCode ?? undefined,
    scheduledDate: row.scheduledDate ?? undefined,
  };
}

export class MaintenanceLogService {
  constructor(
    private readonly repo: IMaintenanceRepository = new MaintenanceRepository(),
    private readonly assets: AssetRepository = new AssetRepository(),
    private readonly lifecycle: AssetLifecycleService = new AssetLifecycleService()
  ) {}

  async list(rawQuery: unknown): Promise<MaintenanceLogDTO[]> {
    const filters = listMaintenanceQuerySchema.parse(rawQuery ?? {});
    const rows = await this.repo.list(filters);
    return rows.map(toDTO);
  }

  async getById(rawId: string): Promise<MaintenanceLogDTO> {
    const id = maintenanceIdSchema.parse(rawId);
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError("Maintenance log", id);
    return toDTO(row);
  }

  async create(rawInput: unknown, actor: ActorContext): Promise<MaintenanceLogDTO> {
    const input = createMaintenanceSchema.parse(rawInput);
    const seq = (await this.repo.countYear()) + 1;
    const logCode = formatSequentialCode("MNT", seq);

    const row = await this.repo.create({
      logCode,
      assetId: input.assetId ?? null,
      assetCode: input.assetCode,
      assetName: input.assetName,
      category: input.category,
      condition: input.condition,
      source: input.source,
      dateLogged: todayDateString(),
      loggedByUserId: actor.userId,
      loggedByName: actor.displayName,
      notes: input.notes ?? "",
      isResolved: false,
      resolutionDate: null,
      resolutionNotes: null,
      resolvedByUserId: null,
      resolvedByName: null,
      relatedBorrowLogCode: input.relatedBorrowLogCode ?? null,
      scheduledDate: input.scheduledDate ?? null,
    });

    if (input.assetId && input.condition !== "good" && input.condition !== "resolved") {
      const asset = await this.assets.findById(input.assetId);
      if (asset && asset.status === "active") {
        await this.assets.update(asset.id, {
          status: "needs_repair",
          lastUpdated: new Date(),
        });
        await this.lifecycle.record({
          assetId: asset.id,
          assetCode: asset.assetCode,
          eventType: "flagged_maintenance",
          actor,
          fromStatus: asset.status,
          toStatus: "needs_repair",
          fromHolder: asset.currentHolder,
          toHolder: asset.currentHolder,
          payload: { maintenanceLogCode: logCode, notes: input.notes ?? null },
        });
      }
    }

    return toDTO(row);
  }

  /**
   * Internal helper used by borrow-log return path.
   */
  async createFromReturn(
    input: {
      assetId: string;
      assetCode: string;
      assetName: string;
      category: MaintenanceLogDTO["category"];
      notes: string;
      relatedBorrowLogCode: string;
      condition: "needs_maintenance" | "damaged";
    },
    actor: ActorContext
  ): Promise<MaintenanceLogDTO> {
    return this.create(
      {
        assetId: input.assetId,
        assetCode: input.assetCode,
        assetName: input.assetName,
        category: input.category,
        condition: input.condition,
        source: "return_checkout",
        notes: input.notes,
        relatedBorrowLogCode: input.relatedBorrowLogCode,
      },
      actor
    );
  }

  async resolve(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<MaintenanceLogDTO> {
    const id = maintenanceIdSchema.parse(rawId);
    const input = resolveMaintenanceSchema.parse(rawInput);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Maintenance log", id);
    if (existing.isResolved) {
      throw new ConflictError("Maintenance log is already resolved.");
    }

    const updated = await this.repo.update(id, {
      isResolved: true,
      condition: "resolved",
      resolutionDate: todayDateString(),
      resolutionNotes: input.resolutionNotes,
      resolvedByUserId: actor.userId,
      resolvedByName: actor.displayName,
    });
    if (!updated) throw new NotFoundError("Maintenance log", id);

    if (existing.assetId) {
      const asset = await this.assets.findById(existing.assetId);
      if (asset && asset.status === "needs_repair") {
        await this.assets.update(asset.id, {
          status: "active",
          lastUpdated: new Date(),
        });
        await this.lifecycle.record({
          assetId: asset.id,
          assetCode: asset.assetCode,
          eventType: "status_changed",
          actor,
          fromStatus: asset.status,
          toStatus: "active",
          payload: {
            via: "maintenance_resolved",
            maintenanceLogCode: existing.logCode,
          },
        });
      }
    }

    return toDTO(updated);
  }
}
