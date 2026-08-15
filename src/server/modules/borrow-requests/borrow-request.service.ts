import type {
  BorrowRequestHistoryEntry,
  BorrowRequestRow,
  ConsumableRow,
  StockHistoryEntry,
} from "@/server/db/schema";
import { consumables } from "@/server/db/schema/consumables";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  generateOperationalCode,
  isoNow,
  todayDateString,
} from "@/server/shared/codes";
import type { ActorContext } from "@/server/shared/auth";
import { isAssetOperatorRole } from "@/server/shared/roles";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "@/server/shared/errors";
import { eq, or } from "drizzle-orm";

import { BorrowRequestRepository } from "./borrow-request.repository";
import type {
  BorrowRequestDTO,
  IBorrowRequestRepository,
} from "./borrow-request.types";
import { AssetRepository } from "../assets/asset.repository";
import { AuditLogRepository } from "../audit-logs/audit-logs.repository";
import { BorrowLogService } from "../borrow-log/borrow-log.service";
import { BorrowLogRepository } from "../borrow-log/borrow-log.repository";
import { ConsumableRepository } from "../consumables/consumable.repository";
import {
  PurchaseLotService,
  type LotCostAllocation,
} from "../purchase-lots/purchase-lot.service";
import { withTransaction } from "@/server/db/transaction";
import {
  approveBorrowRequestSchema,
  borrowRequestIdSchema,
  cancelBorrowRequestSchema,
  createBorrowRequestSchema,
  listBorrowRequestsQuerySchema,
  rejectBorrowRequestSchema,
  releaseBorrowRequestSchema,
  markUnreleasedBorrowRequestSchema,
  returnBorrowRequestSchema,
} from "./borrow-request.validation";

function money(value: string | number): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function toDTO(row: BorrowRequestRow): BorrowRequestDTO {
  const history = Array.isArray(row.history) ? row.history : [];
  return {
    id: row.id,
    requestCode: row.requestCode,
    requesterName: row.requesterName,
    requesterEmail: row.requesterEmail,
    requesterPhone: row.requesterPhone,
    department: row.department,
    items: row.items,
    purpose: row.purpose,
    requestedAt:
      row.requestedAt instanceof Date
        ? row.requestedAt.toISOString()
        : String(row.requestedAt),
    relativeTime: formatRelativeTime(row.requestedAt),
    expectedReturnDate: row.expectedReturnDate,
    status: row.status,
    notes: row.notes ?? undefined,
    rejectionReason: row.rejectionReason ?? undefined,
    pickedUpBy: row.pickedUpBy ?? undefined,
    history,
  };
}

function historyEntry(
  action: BorrowRequestHistoryEntry["action"],
  actor: string,
  note?: string
): BorrowRequestHistoryEntry {
  return {
    id: crypto.randomUUID(),
    action,
    actor,
    timestamp: isoNow(),
    ...(note ? { note } : {}),
  };
}

function stockHistoryEntry(
  type: StockHistoryEntry["type"],
  quantityChange: number,
  actor: string,
  reason?: string,
  notes?: string,
  extra?: Partial<
    Pick<
      StockHistoryEntry,
      | "unitCost"
      | "supplierId"
      | "supplierName"
      | "lotCode"
      | "totalCost"
      | "lotAllocations"
      | "recipientName"
    >
  >
): StockHistoryEntry {
  return {
    id: crypto.randomUUID(),
    date: todayDateString(),
    type,
    quantityChange,
    actor,
    ...(reason ? { reason } : {}),
    ...(notes ? { notes } : {}),
    ...extra,
  };
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: Record<string, number>;
}

export class BorrowRequestService {
  constructor(
    private readonly repo: IBorrowRequestRepository = new BorrowRequestRepository(),
    private readonly auditLogs = new AuditLogRepository(),
    private readonly assetRepo = new AssetRepository(),
    private readonly borrowLogs = new BorrowLogService(),
    private readonly borrowLogRepo = new BorrowLogRepository(),
    private readonly consumableRepo = new ConsumableRepository(),
    private readonly purchaseLots = new PurchaseLotService()
  ) {}

  async list(
    rawQuery: unknown,
    actor?: ActorContext
  ): Promise<{ data: BorrowRequestDTO[]; meta: PaginatedMeta }> {
    const filters = listBorrowRequestsQuerySchema.parse(rawQuery ?? {});
    if (actor && !isAssetOperatorRole(actor.role)) {
      filters.requesterUserId = actor.userId;
    }
    
    const { page, limit, status, ...countFilters } = filters;
    const [rows, total, counts] = await Promise.all([
      this.repo.list(filters),
      this.repo.count(filters),
      this.repo.countByStatus(countFilters),
    ]);
    
    return {
      data: rows.map(toDTO),
      meta: {
        total,
        page: filters.page || 1,
        limit: filters.limit || 20,
        totalPages: Math.ceil(total / (filters.limit || 20)),
        counts,
      },
    };
  }

  async getById(rawId: string, actor?: ActorContext): Promise<BorrowRequestDTO> {
    const id = borrowRequestIdSchema.parse(rawId);
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError("Borrow request", id);
    if (actor && !isAssetOperatorRole(actor.role) && row.requesterUserId !== actor.userId) {
      throw new ForbiddenError("You are not allowed to view this request.");
    }
    return toDTO(row);
  }

  async create(rawInput: unknown, actor: ActorContext): Promise<BorrowRequestDTO> {
    const input = createBorrowRequestSchema.parse(rawInput);
    const requestCode = generateOperationalCode("REQ");

    const requesterUserId = isAssetOperatorRole(actor.role)
      ? (input.requesterUserId ?? actor.userId)
      : actor.userId;

    const submitted = historyEntry("submitted", actor.displayName, "Request recorded");

    const row = await withTransaction(async (tx) => {
      const created = await this.repo.create({
        requestCode,
        requesterUserId,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail.toLowerCase(),
        requesterPhone: input.requesterPhone ?? "",
        department: input.department,
        items: input.items,
        purpose: input.purpose,
        expectedReturnDate: input.expectedReturnDate,
        status: "pending",
        notes: input.notes ?? null,
        rejectionReason: null,
        history: [submitted],
        requestedAt: new Date(),
      }, tx);

      await this.auditLogs.create({
        entityType: "borrow_request",
        entityId: created.id,
        action: "submitted",
        actorName: actor.displayName,
        actorUserId: actor.userId,
        notes: "Request recorded",
      }, tx);

      return created;
    });

    return toDTO(row);
  }

  async approve(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<BorrowRequestDTO> {
    const id = borrowRequestIdSchema.parse(rawId);
    const input = approveBorrowRequestSchema.parse(rawInput ?? {});
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Borrow request", id);
    if (existing.status !== "pending") {
      throw new ConflictError("Only pending requests can be approved.");
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("approved", actor.displayName, input.note),
    ];

    // Note: Since a single request can now contain multiple items, we shouldn't necessarily block the whole request
    // if ONE item is already checked out, or we should block it all. For simplicity, we just check all requested assets.
    for (const item of existing.items) {
      if (item.assetId) {
        const asset = await this.assetRepo.findById(item.assetId);
        if (asset && asset.currentHolder) {
          throw new ConflictError(`Cannot approve: Asset ${item.assetCode} is currently borrowed by ${asset.currentHolder}. It will remain in pending status until available.`);
        }
      }
    }

    const updated = await withTransaction(async (tx) => {
      const up = await this.repo.update(id, {
        status: "approved",
        history,
      }, tx);
      if (!up) throw new NotFoundError("Borrow request", id);

      await this.auditLogs.create({
        entityType: "borrow_request",
        entityId: up.id,
        action: "approved",
        actorName: actor.displayName,
        actorUserId: actor.userId,
        notes: input.note,
      }, tx);

      return up;
    });
    return toDTO(updated);
  }

  async reject(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<BorrowRequestDTO> {
    const id = borrowRequestIdSchema.parse(rawId);
    const input = rejectBorrowRequestSchema.parse(rawInput);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Borrow request", id);
    if (existing.status !== "pending") {
      throw new ConflictError("Only pending requests can be rejected.");
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("rejected", actor.displayName, input.reason),
    ];

    const updated = await withTransaction(async (tx) => {
      const up = await this.repo.update(id, {
        status: "rejected",
        rejectionReason: input.reason,
        history,
      }, tx);
      if (!up) throw new NotFoundError("Borrow request", id);

      await this.auditLogs.create({
        entityType: "borrow_request",
        entityId: up.id,
        action: "rejected",
        actorName: actor.displayName,
        actorUserId: actor.userId,
        notes: input.reason,
      }, tx);

      return up;
    });
    return toDTO(updated);
  }

  async release(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<BorrowRequestDTO> {
    const id = borrowRequestIdSchema.parse(rawId);
    const input = releaseBorrowRequestSchema.parse(rawInput ?? {});
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Borrow request", id);
    if (existing.status !== "approved") {
      throw new ConflictError("Only approved requests can be released.");
    }

    const noteWithPicker = input.note
      ? `Released to: ${input.pickedUpBy}. ${input.note}`
      : `Released to: ${input.pickedUpBy}`;

    // Open accountable borrow log for assets first while request is still approved.
    for (const item of existing.items) {
      if (item.assetId) {
        const asset = await this.assetRepo.findById(item.assetId);
        if (!asset) throw new NotFoundError("Asset", item.assetId);
        await this.borrowLogs.release(
          {
            assetId: item.assetId,
            requestId: existing.id,
            borrowerName: input.pickedUpBy,
            borrowerEmail: existing.requesterEmail,
            borrowerPhone: existing.requesterPhone || "",
            department: existing.department,
            dueDate: this.borrowLogs.defaultDueDate(),
            notes: noteWithPicker,
            borrowerUserId: existing.requesterUserId ?? undefined,
          },
          actor
        );
      }
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("released", actor.displayName, noteWithPicker),
    ];

    const updated = await withTransaction(async (tx) => {
      const releasedConsumables: Array<{
        consumableId: string;
        itemCode: string;
        name: string;
        quantity: number;
        unit: string;
        totalCost: string;
      }> = [];

      // Process consumable deductions and lot allocations
      for (const item of existing.items) {
        if (item.itemType === "consumable" || item.consumableId) {
          let consumable: ConsumableRow | null = null;
          if (item.consumableId) {
            consumable = await this.consumableRepo.findByIdForUpdate(
              item.consumableId,
              tx
            );
          }
          if (!consumable && item.itemDescription) {
            const [found] = await tx
              .select()
              .from(consumables)
              .where(
                or(
                  eq(consumables.name, item.itemDescription),
                  eq(consumables.itemCode, item.itemDescription)
                )
              )
              .for("update")
              .limit(1);
            consumable = found ?? null;
          }

          if (!consumable) {
            throw new NotFoundError(
              "Consumable",
              item.consumableId || item.itemDescription
            );
          }

          if (consumable.currentQty < item.quantity) {
            throw new BadRequestError(
              `Insufficient stock for ${consumable.name} (${consumable.itemCode}). Available: ${consumable.currentQty} ${consumable.unit}, requested: ${item.quantity}.`
            );
          }

          const lineConfig = input.consumableLines?.find(
            (cl) =>
              (cl.consumableId && cl.consumableId === consumable!.id) ||
              (cl.itemDescription &&
                cl.itemDescription === item.itemDescription)
          );

          let lotAllocations: LotCostAllocation[] = [];

          if (
            lineConfig &&
            !lineConfig.useFifo &&
            lineConfig.allocations &&
            lineConfig.allocations.length > 0
          ) {
            const totalAllocated = lineConfig.allocations.reduce(
              (sum, a) => sum + a.quantity,
              0
            );
            if (totalAllocated !== item.quantity) {
              throw new BadRequestError(
                `Lot allocations for ${consumable.name} must total ${item.quantity} (got ${totalAllocated}).`
              );
            }

            for (const alloc of lineConfig.allocations) {
              const result = alloc.lotId
                ? await this.purchaseLots.consumeFromLotId(
                    alloc.lotId,
                    alloc.quantity,
                    tx,
                    consumable.id
                  )
                : await this.purchaseLots.consumeFromLot(
                    alloc.lotCode!,
                    alloc.quantity,
                    tx,
                    consumable.id
                  );
              lotAllocations.push(result.allocation);
            }
          } else {
            lotAllocations = await this.purchaseLots.consumeFifo(
              consumable.id,
              item.quantity,
              tx
            );
          }

          const totalCost = lotAllocations.reduce(
            (sum, a) => sum + Number(a.total || 0),
            0
          );
          const primary =
            lotAllocations.find((a) => !a.uncosted) ?? lotAllocations[0];

          const stockHistory = [
            ...(Array.isArray(consumable.history) ? consumable.history : []),
            stockHistoryEntry(
              "checkout",
              -item.quantity,
              actor.displayName,
              `Request ${existing.requestCode}`,
              noteWithPicker,
              {
                unitCost: primary?.unitCost,
                supplierId: primary?.supplierId ?? undefined,
                supplierName: primary?.supplierName ?? undefined,
                lotCode: primary?.lotCode ?? undefined,
                totalCost: money(totalCost),
                lotAllocations,
                recipientName: input.pickedUpBy,
              }
            ),
          ];

          await this.consumableRepo.update(
            consumable.id,
            {
              currentQty: consumable.currentQty - item.quantity,
              history: stockHistory,
            },
            tx
          );

          await this.auditLogs.create(
            {
              entityType: "consumable",
              entityId: consumable.id,
              action: "checkout",
              actorName: actor.displayName,
              actorUserId: actor.userId,
              notes: `Released ${item.quantity} ${consumable.unit} for request ${existing.requestCode} to ${input.pickedUpBy}`,
              metadata: {
                requestCode: existing.requestCode,
                recipientName: input.pickedUpBy,
                quantity: item.quantity,
                unit: consumable.unit,
                previousQty: consumable.currentQty,
                newQty: consumable.currentQty - item.quantity,
                totalCost: money(totalCost),
                lotAllocations,
              },
            },
            tx
          );

          releasedConsumables.push({
            consumableId: consumable.id,
            itemCode: consumable.itemCode,
            name: consumable.name,
            quantity: item.quantity,
            unit: consumable.unit,
            totalCost: money(totalCost),
          });
        }
      }

      const up = await this.repo.update(
        id,
        {
          status: "released",
          pickedUpBy: input.pickedUpBy,
          history,
        },
        tx
      );
      if (!up) throw new NotFoundError("Borrow request", id);

      await this.auditLogs.create(
        {
          entityType: "borrow_request",
          entityId: up.id,
          action: "released",
          actorName: actor.displayName,
          actorUserId: actor.userId,
          notes: noteWithPicker,
          metadata: {
            requestCode: existing.requestCode,
            pickedUpBy: input.pickedUpBy,
            releasedConsumablesCount: releasedConsumables.length,
            releasedConsumables,
          },
        },
        tx
      );

      return up;
    });
    return toDTO(updated);
  }

  async cancel(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<BorrowRequestDTO> {
    const id = borrowRequestIdSchema.parse(rawId);
    const input = cancelBorrowRequestSchema.parse(rawInput ?? {});
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Borrow request", id);
    if (existing.status !== "pending") {
      throw new ConflictError("Only pending requests can be cancelled.");
    }

    if (
      !isAssetOperatorRole(actor.role) &&
      existing.requesterUserId !== actor.userId
    ) {
      throw new ForbiddenError("You can only cancel your own requests.");
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("cancelled", actor.displayName, input.note),
    ];

    const updated = await withTransaction(async (tx) => {
      const up = await this.repo.update(
        id,
        { status: "cancelled", history },
        tx
      );
      if (!up) throw new NotFoundError("Borrow request", id);

      await this.auditLogs.create(
        {
          entityType: "borrow_request",
          entityId: up.id,
          action: "cancelled",
          actorName: actor.displayName,
          actorUserId: actor.userId,
          notes: input.note,
        },
        tx
      );

      return up;
    });

    return toDTO(updated);
  }

  async markUnreleased(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<BorrowRequestDTO> {
    const id = borrowRequestIdSchema.parse(rawId);
    const input = markUnreleasedBorrowRequestSchema.parse(rawInput ?? {});
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Borrow request", id);
    if (existing.status !== "approved") {
      throw new ConflictError("Only approved requests can be marked as unreleased.");
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("unreleased", actor.displayName, input.note),
    ];

    const updated = await withTransaction(async (tx) => {
      const up = await this.repo.update(id, {
        status: "unreleased",
        history,
      }, tx);
      if (!up) throw new NotFoundError("Borrow request", id);

      for (const item of up.items) {
        if (item.assetId) {
          await this.assetRepo.update(item.assetId, { currentHolder: null }, tx);
        }
      }

      await this.auditLogs.create({
        entityType: "borrow_request",
        entityId: up.id,
        action: "unreleased",
        actorName: actor.displayName,
        actorUserId: actor.userId,
        notes: input.note,
      }, tx);

      return up;
    });
    return toDTO(updated);
  }

  async markReturned(rawId: string, rawInput: unknown, actor: ActorContext): Promise<BorrowRequestDTO> {
    const id = borrowRequestIdSchema.parse(rawId);
    const input = returnBorrowRequestSchema.parse(rawInput ?? {});
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Borrow request", id);
    if (existing.status !== "released") {
      throw new ConflictError("Only released requests can be marked returned.");
    }

    const hasReturnableAssets = existing.items.some(
      (item) => item.itemType === "asset" || Boolean(item.assetId)
    );
    if (!hasReturnableAssets) {
      throw new ConflictError(
        "Consumable supply requests cannot be marked as returned because consumable items are consumed upon issuance."
      );
    }

    const noteWithReturner = input.note
      ? `Returned by: ${input.returnedBy}. ${input.note}`
      : `Returned by: ${input.returnedBy}`;

    // Close active borrow log (clears holder + lifecycle) when this request released an asset.
    for (const item of existing.items) {
      if (item.assetId) {
        const open = await this.borrowLogRepo.findActiveByAssetId(item.assetId);
        if (open) {
          await this.borrowLogs.returnLog(
            open.id,
            {
              condition: "good",
              conditionNotes: noteWithReturner,
              flagMaintenance: false,
            },
            actor
          );
        } else {
          // Legacy release without log — clear holder so registry is usable again.
          const asset = await this.assetRepo.findById(item.assetId);
          if (asset?.currentHolder) {
            await this.assetRepo.update(item.assetId, {
              currentHolder: null,
              lastUpdated: new Date(),
            });
          }
        }
      }
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("returned", actor.displayName, noteWithReturner),
    ];

    const updated = await withTransaction(async (tx) => {
      const up = await this.repo.update(
        id,
        {
          status: "returned",
          history,
        },
        tx
      );
      if (!up) throw new NotFoundError("Borrow request", id);

      await this.auditLogs.create(
        {
          entityType: "borrow_request",
          entityId: up.id,
          action: "returned",
          actorName: actor.displayName,
          actorUserId: actor.userId,
          notes: noteWithReturner,
        },
        tx
      );

      return up;
    });
    return toDTO(updated);
  }
}
