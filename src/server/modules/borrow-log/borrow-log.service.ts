import type {
  BorrowLogHistoryEntry,
  BorrowTransactionRow,
} from "@/server/db/schema";
import { formatSequentialCode, isoNow, todayDateString } from "@/server/shared/codes";
import type { ActorContext } from "@/server/shared/auth";
import {
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";
import { AssetRepository } from "@/server/modules/assets/asset.repository";
import { AssetLifecycleService } from "@/server/modules/assets/asset.lifecycle.service";
import { BorrowRequestRepository } from "@/server/modules/borrow-requests/borrow-request.repository";
import { MaintenanceLogService } from "@/server/modules/maintenance/maintenance.service";

import { BorrowLogRepository } from "./borrow-log.repository";
import type { BorrowLogDTO, IBorrowLogRepository } from "./borrow-log.types";
import {
  borrowLogIdSchema,
  listBorrowLogQuerySchema,
  releaseBorrowSchema,
  returnBorrowSchema,
} from "./borrow-log.validation";

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.floor((b - a) / (24 * 60 * 60 * 1000));
}

export function toBorrowLogDTO(row: BorrowTransactionRow): BorrowLogDTO {
  const today = todayDateString();
  const history = Array.isArray(row.history) ? row.history : [];
  let status: BorrowLogDTO["status"] = "active";
  let daysOverdue: number | undefined;

  if (row.status === "returned") {
    status = "returned";
  } else if (row.dueDate < today) {
    status = "overdue";
    daysOverdue = daysBetween(row.dueDate, today);
  }

  return {
    id: row.id,
    logCode: row.logCode,
    requestCode: row.requestCode ?? "",
    borrowerName: row.borrowerName,
    borrowerEmail: row.borrowerEmail,
    borrowerPhone: row.borrowerPhone,
    department: row.department,
    assetCode: row.assetCode,
    assetName: row.assetName,
    category: row.category,
    releasedAt:
      row.releasedAt instanceof Date
        ? row.releasedAt.toISOString()
        : String(row.releasedAt),
    dueDate: row.dueDate,
    returnedAt: row.returnedAt
      ? row.returnedAt instanceof Date
        ? row.returnedAt.toISOString()
        : String(row.returnedAt)
      : undefined,
    daysOverdue,
    status,
    conditionOnReturn: row.conditionOnReturn ?? undefined,
    conditionNotes: row.conditionNotes ?? undefined,
    releasedBy: row.releasedByName,
    receivedBy: row.receivedByName ?? undefined,
    history,
  };
}

function historyEntry(
  action: BorrowLogHistoryEntry["action"],
  actor: string,
  notes?: string
): BorrowLogHistoryEntry {
  return {
    id: crypto.randomUUID(),
    action,
    actor,
    timestamp: isoNow(),
    ...(notes ? { notes } : {}),
  };
}

export class BorrowLogService {
  constructor(
    private readonly repo: IBorrowLogRepository = new BorrowLogRepository(),
    private readonly assets: AssetRepository = new AssetRepository(),
    private readonly lifecycle: AssetLifecycleService = new AssetLifecycleService(),
    private readonly requests: BorrowRequestRepository = new BorrowRequestRepository(),
    private readonly maintenance: MaintenanceLogService = new MaintenanceLogService()
  ) {}

  async list(rawQuery: unknown): Promise<BorrowLogDTO[]> {
    const filters = listBorrowLogQuerySchema.parse(rawQuery ?? {});
    const rows = await this.repo.list(filters);
    return rows.map(toBorrowLogDTO);
  }

  async getById(rawId: string): Promise<BorrowLogDTO> {
    const id = borrowLogIdSchema.parse(rawId);
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError("Borrow log", id);
    return toBorrowLogDTO(row);
  }

  /**
   * Releases an asset: opens a custody log + stamps asset.currentHolder + lifecycle.
   */
  async release(rawInput: unknown, actor: ActorContext): Promise<BorrowLogDTO> {
    const input = releaseBorrowSchema.parse(rawInput);
    const asset = await this.assets.findById(input.assetId);
    if (!asset) throw new NotFoundError("Asset", input.assetId);

    if (asset.status !== "active" || asset.currentHolder) {
      throw new ConflictError("Asset is not available for release.");
    }

    const open = await this.repo.findActiveByAssetId(asset.id);
    if (open) {
      throw new ConflictError("Asset already has an active borrow log.");
    }

    let requestId: string | null = input.requestId ?? null;
    let requestCode: string | null = input.requestCode ?? null;

    if (input.requestId) {
      const req = await this.requests.findById(input.requestId);
      if (!req) throw new NotFoundError("Borrow request", input.requestId);
      if (req.status !== "approved") {
        throw new ConflictError("Borrow request must be approved before release.");
      }
      requestCode = req.requestCode;
      requestId = req.id;
    }

    const seq = (await this.repo.countYear()) + 1;
    const logCode = formatSequentialCode("LOG", seq);
    const entry = historyEntry("released", actor.displayName, input.notes);

    const row = await this.repo.create({
      logCode,
      requestId,
      requestCode,
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.name,
      category: asset.category,
      borrowerUserId: input.borrowerUserId ?? null,
      borrowerName: input.borrowerName,
      borrowerEmail: (input.borrowerEmail ?? "").toLowerCase(),
      borrowerPhone: input.borrowerPhone ?? "",
      department: input.department,
      releasedAt: new Date(),
      dueDate: input.dueDate,
      returnedAt: null,
      status: "active",
      conditionOnReturn: null,
      conditionNotes: null,
      releasedByUserId: actor.userId,
      releasedByName: actor.displayName,
      receivedByUserId: null,
      receivedByName: null,
      history: [entry],
    });

    await this.assets.update(asset.id, {
      currentHolder: input.borrowerName,
      department: input.department,
      lastUpdated: new Date(),
    });

    await this.lifecycle.record({
      assetId: asset.id,
      assetCode: asset.assetCode,
      eventType: "released",
      actor,
      fromStatus: asset.status,
      toStatus: asset.status,
      fromHolder: asset.currentHolder,
      toHolder: input.borrowerName,
      payload: {
        logCode,
        requestCode,
        dueDate: input.dueDate,
        notes: input.notes ?? null,
      },
    });

    return toBorrowLogDTO(row);
  }

  async returnLog(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<BorrowLogDTO> {
    const id = borrowLogIdSchema.parse(rawId);
    const input = returnBorrowSchema.parse(rawInput);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Borrow log", id);
    if (existing.status !== "active") {
      throw new ConflictError("Only active borrow logs can be returned.");
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry(
        input.condition === "needs_repair" || input.flagMaintenance
          ? "flagged_repair"
          : "returned",
        actor.displayName,
        input.conditionNotes ?? `Condition: ${input.condition}`
      ),
    ];

    const updated = await this.repo.update(id, {
      status: "returned",
      returnedAt: new Date(),
      conditionOnReturn: input.condition,
      conditionNotes: input.conditionNotes ?? null,
      receivedByUserId: actor.userId,
      receivedByName: actor.displayName,
      history,
    });
    if (!updated) throw new NotFoundError("Borrow log", id);

    if (existing.assetId) {
      const asset = await this.assets.findById(existing.assetId);
      if (asset) {
        const nextStatus =
          input.condition === "needs_repair" || input.flagMaintenance
            ? "needs_repair"
            : asset.status;

        await this.assets.update(asset.id, {
          currentHolder: null,
          status: nextStatus,
          lastUpdated: new Date(),
        });

        await this.lifecycle.record({
          assetId: asset.id,
          assetCode: asset.assetCode,
          eventType: "returned",
          actor,
          fromStatus: asset.status,
          toStatus: nextStatus,
          fromHolder: existing.borrowerName,
          toHolder: null,
          payload: {
            logCode: existing.logCode,
            condition: input.condition,
            conditionNotes: input.conditionNotes ?? null,
          },
        });

        if (
          (input.condition === "needs_repair" || input.flagMaintenance) &&
          asset.status !== nextStatus
        ) {
          await this.lifecycle.record({
            assetId: asset.id,
            assetCode: asset.assetCode,
            eventType: "status_changed",
            actor,
            fromStatus: asset.status,
            toStatus: nextStatus,
            payload: { via: "borrow_return" },
          });
        }

        if (input.condition === "needs_repair" || input.flagMaintenance) {
          await this.maintenance.createFromReturn(
            {
              assetId: asset.id,
              assetCode: asset.assetCode,
              assetName: asset.name,
              category: asset.category,
              notes:
                input.conditionNotes?.trim() ||
                `Returned with condition: ${input.condition}`,
              relatedBorrowLogCode: existing.logCode,
              condition:
                input.condition === "damaged" ? "damaged" : "needs_maintenance",
            },
            actor
          );
        }
      }
    }

    if (existing.requestId) {
      const req = await this.requests.findById(existing.requestId);
      if (req && req.status === "approved") {
        await this.requests.update(req.id, {
          status: "returned",
          history: [
            ...(Array.isArray(req.history) ? req.history : []),
            {
              id: crypto.randomUUID(),
              action: "returned",
              actor: actor.displayName,
              timestamp: isoNow(),
            },
          ],
        });
      }
    }

    return toBorrowLogDTO(updated);
  }
}
