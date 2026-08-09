import type {
  BorrowLogHistoryEntry,
  BorrowTransactionRow,
} from "@/server/db/schema";
import {
  dueDatePlusDays,
  generateOperationalCode,
  isoNow,
  todayDateString,
} from "@/server/shared/codes";
import type { ActorContext } from "@/server/shared/auth";
import { isAssetOperatorRole } from "@/server/shared/roles";
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "@/server/shared/errors";
import {
  isUniqueViolation,
  withTransaction,
  type DbSession,
} from "@/server/db/transaction";
import { AssetRepository } from "@/server/modules/assets/asset.repository";
import { AssetLifecycleService } from "@/server/modules/assets/asset.lifecycle.service";
import { BorrowRequestRepository } from "@/server/modules/borrow-requests/borrow-request.repository";
import { MaintenanceRepository } from "@/server/modules/maintenance/maintenance.repository";

import { BorrowLogRepository } from "./borrow-log.repository";
import type { BorrowLogDTO } from "./borrow-log.types";
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

/**
 * Custody authority for coded equipment.
 * Release/return always write: borrow log + asset holder + lifecycle (atomic).
 * Optional: request status + maintenance open case.
 */
export class BorrowLogService {
  constructor(
    private readonly repo = new BorrowLogRepository(),
    private readonly assets = new AssetRepository(),
    private readonly lifecycle = new AssetLifecycleService(),
    private readonly requests = new BorrowRequestRepository(),
    private readonly maintenance = new MaintenanceRepository()
  ) {}

  async list(rawQuery: unknown, actor?: ActorContext): Promise<BorrowLogDTO[]> {
    const filters = listBorrowLogQuerySchema.parse(rawQuery ?? {});
    if (actor && !isAssetOperatorRole(actor.role)) {
      filters.borrowerUserId = actor.userId;
    }
    const rows = await this.repo.list(filters);
    return rows.map(toBorrowLogDTO);
  }

  async getById(rawId: string, actor?: ActorContext): Promise<BorrowLogDTO> {
    const id = borrowLogIdSchema.parse(rawId);
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError("Borrow log", id);
    if (actor && !isAssetOperatorRole(actor.role) && row.borrowerUserId !== actor.userId) {
      throw new ForbiddenError("You are not allowed to view this log.");
    }
    return toBorrowLogDTO(row);
  }

  /**
   * Atomic release: lock asset → open log → set holder → lifecycle.
   * Race-safe via FOR UPDATE + unique index on one active log per asset.
   */
  async release(rawInput: unknown, actor: ActorContext): Promise<BorrowLogDTO> {
    const input = releaseBorrowSchema.parse(rawInput);

    try {
      return await withTransaction(async (tx) => this.releaseInTx(input, actor, tx));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(
          "Asset already has an active borrow log (concurrent release prevented)."
        );
      }
      throw error;
    }
  }

  private async releaseInTx(
    input: ReturnType<typeof releaseBorrowSchema.parse>,
    actor: ActorContext,
    tx: DbSession
  ): Promise<BorrowLogDTO> {
    const asset = await this.assets.findByIdForUpdate(input.assetId, tx);
    if (!asset) throw new NotFoundError("Asset", input.assetId);

    if (asset.status !== "active" || asset.currentHolder) {
      throw new ConflictError("Asset is not available for release.");
    }

    const open = await this.repo.findActiveByAssetId(asset.id, tx);
    if (open) {
      throw new ConflictError("Asset already has an active borrow log.");
    }

    let requestId: string | null = input.requestId ?? null;
    let requestCode: string | null = input.requestCode ?? null;

    if (input.requestId) {
      const req = await this.requests.findById(input.requestId, tx);
      if (!req) throw new NotFoundError("Borrow request", input.requestId);
      if (req.status !== "approved") {
        throw new ConflictError("Borrow request must be approved before release.");
      }
      requestCode = req.requestCode;
      requestId = req.id;
    }

    const logCode = generateOperationalCode("LOG");
    const entry = historyEntry("released", actor.displayName, input.notes);

    const row = await this.repo.create(
      {
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
      },
      tx
    );

    await this.assets.update(
      asset.id,
      {
        currentHolder: input.borrowerName,
        department: input.department,
        lastUpdated: new Date(),
      },
      tx
    );

    await this.lifecycle.record(
      {
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
          logId: row.id,
          requestCode,
          requestId,
          dueDate: input.dueDate,
          notes: input.notes ?? null,
          borrowerEmail: input.borrowerEmail ?? null,
        },
      },
      tx
    );

    return toBorrowLogDTO(row);
  }

  /**
   * Atomic return: lock log → close → clear holder → lifecycle
   * → optional maintenance case → mark request returned.
   */
  async returnLog(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<BorrowLogDTO> {
    const id = borrowLogIdSchema.parse(rawId);
    const input = returnBorrowSchema.parse(rawInput);

    return withTransaction(async (tx) => {
      const existing = await this.repo.findByIdForUpdate(id, tx);
      if (!existing) throw new NotFoundError("Borrow log", id);
      if (existing.status !== "active") {
        throw new ConflictError("Only active borrow logs can be returned.");
      }

      const needsMaint =
        input.condition === "needs_repair" ||
        input.condition === "damaged" ||
        Boolean(input.flagMaintenance);

      const history = [
        ...(Array.isArray(existing.history) ? existing.history : []),
        historyEntry(
          needsMaint ? "flagged_repair" : "returned",
          actor.displayName,
          input.conditionNotes ?? `Condition: ${input.condition}`
        ),
      ];

      const updated = await this.repo.update(
        id,
        {
          status: "returned",
          returnedAt: new Date(),
          conditionOnReturn: input.condition,
          conditionNotes: input.conditionNotes ?? null,
          receivedByUserId: actor.userId,
          receivedByName: actor.displayName,
          history,
        },
        tx
      );
      if (!updated) throw new NotFoundError("Borrow log", id);

      if (existing.assetId) {
        const asset = await this.assets.findByIdForUpdate(existing.assetId, tx);
        if (asset) {
          const nextStatus = needsMaint ? "needs_repair" : asset.status;

          await this.assets.update(
            asset.id,
            {
              currentHolder: null,
              status: nextStatus,
              lastUpdated: new Date(),
            },
            tx
          );

          await this.lifecycle.record(
            {
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
                logId: existing.id,
                condition: input.condition,
                conditionNotes: input.conditionNotes ?? null,
              },
            },
            tx
          );

          if (asset.status !== nextStatus) {
            await this.lifecycle.record(
              {
                assetId: asset.id,
                assetCode: asset.assetCode,
                eventType: "status_changed",
                actor,
                fromStatus: asset.status,
                toStatus: nextStatus,
                payload: { via: "borrow_return", logCode: existing.logCode },
              },
              tx
            );
          }

          if (needsMaint) {
            const mntCode = generateOperationalCode("MNT");
            await this.maintenance.create(
              {
                logCode: mntCode,
                assetId: asset.id,
                assetCode: asset.assetCode,
                assetName: asset.name,
                category: asset.category,
                condition:
                  input.condition === "damaged" ? "damaged" : "needs_maintenance",
                source: "return_checkout",
                dateLogged: todayDateString(),
                loggedByUserId: actor.userId,
                loggedByName: actor.displayName,
                notes:
                  input.conditionNotes?.trim() ||
                  `Returned with condition: ${input.condition}`,
                isResolved: false,
                resolutionDate: null,
                resolutionNotes: null,
                resolvedByUserId: null,
                resolvedByName: null,
                relatedBorrowLogCode: existing.logCode,
                scheduledDate: null,
              },
              tx
            );

            await this.lifecycle.record(
              {
                assetId: asset.id,
                assetCode: asset.assetCode,
                eventType: "flagged_maintenance",
                actor,
                fromStatus: nextStatus,
                toStatus: nextStatus,
                fromHolder: null,
                toHolder: null,
                payload: {
                  via: "borrow_return",
                  maintenanceLogCode: mntCode,
                  relatedBorrowLogCode: existing.logCode,
                },
              },
              tx
            );
          }
        }
      }

      if (existing.requestId) {
        const req = await this.requests.findById(existing.requestId, tx);
        if (req && req.status === "approved") {
          await this.requests.update(
            req.id,
            {
              status: "returned",
              history: [
                ...(Array.isArray(req.history) ? req.history : []),
                {
                  id: crypto.randomUUID(),
                  action: "returned",
                  actor: actor.displayName,
                  timestamp: isoNow(),
                  note: `Via borrow log ${existing.logCode}`,
                },
              ],
            },
            tx
          );
        }
      }

      return toBorrowLogDTO(updated);
    });
  }

  /** Helper for AssetService.releaseAsset → single custody path. */
  defaultDueDate(): string {
    return dueDatePlusDays(7);
  }
}
