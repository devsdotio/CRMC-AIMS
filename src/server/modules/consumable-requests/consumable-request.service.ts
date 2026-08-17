import type {
  ConsumableRequestHistoryEntry,
  ConsumableRequestLineRow,
  ConsumableRequestReleaseAllocationRow,
  ConsumableRequestRow,
  StockHistoryEntry,
} from "@/server/db/schema";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  generateOperationalCode,
  isoNow,
  todayDateString,
} from "@/server/shared/codes";
import type { ActorContext } from "@/server/shared/auth";
import { resolveDepartmentSnapshot } from "@/server/shared/auth";
import { isAssetOperatorRole } from "@/server/shared/roles";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/server/shared/errors";
import { withTransaction } from "@/server/db/transaction";
import { AuditLogRepository } from "@/server/modules/audit-logs/audit-logs.repository";
import { ConsumableRepository } from "@/server/modules/consumables/consumable.repository";
import {
  PurchaseLotService,
  type LotCostAllocation,
} from "@/server/modules/purchase-lots/purchase-lot.service";

import { ConsumableRequestRepository } from "./consumable-request.repository";
import {
  StockMovementService,
  allocationsToMovementLines,
} from "@/server/modules/stock-movements";
import type {
  ConsumableRequestDTO,
  ConsumableRequestLineDTO,
  ConsumableRequestReleaseAllocationDTO,
} from "./consumable-request.types";
import {
  approveConsumableRequestSchema,
  cancelConsumableRequestSchema,
  consumableRequestIdSchema,
  createConsumableRequestSchema,
  listConsumableRequestsQuerySchema,
  rejectConsumableRequestSchema,
  releaseConsumableRequestSchema,
} from "./consumable-request.validation";

function money(value: string | number): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function toLineDTO(row: ConsumableRequestLineRow): ConsumableRequestLineDTO {
  return {
    id: row.id,
    lineNo: row.lineNo,
    consumableId: row.consumableId,
    itemCode: row.itemCode,
    itemName: row.itemName,
    category: row.category,
    unit: row.unit,
    quantityRequested: row.quantityRequested,
    notes: row.notes ?? undefined,
  };
}

function toAllocationDTO(
  row: ConsumableRequestReleaseAllocationRow
): ConsumableRequestReleaseAllocationDTO {
  return {
    id: row.id,
    requestLineId: row.requestLineId,
    consumableId: row.consumableId,
    purchaseLotId: row.purchaseLotId ?? null,
    lotCode: row.lotCode ?? null,
    supplierId: row.supplierId ?? null,
    supplierName: row.supplierName ?? null,
    quantity: row.quantity,
    unitCost: money(row.unitCost),
    lineTotal: money(row.lineTotal),
    releasedAt:
      row.releasedAt instanceof Date
        ? row.releasedAt.toISOString()
        : String(row.releasedAt),
    releasedByName: row.releasedByName,
  };
}

function toDTO(
  row: ConsumableRequestRow,
  lines: ConsumableRequestLineRow[],
  allocations: ConsumableRequestReleaseAllocationRow[] = []
): ConsumableRequestDTO {
  const history = Array.isArray(row.history) ? row.history : [];
  const allocDtos = allocations.map(toAllocationDTO);
  const totalCost = allocDtos.reduce((sum, a) => sum + Number(a.lineTotal), 0);
  return {
    id: row.id,
    requestCode: row.requestCode,
    requesterUserId: row.requesterUserId ?? undefined,
    requesterName: row.requesterName,
    requesterEmail: row.requesterEmail,
    requesterPhone: row.requesterPhone,
    department: row.department,
    departmentId: row.departmentId,
    projectId: row.projectId,
    source: row.source ?? "portal",
    requestedByName: row.requestedByName ?? undefined,
    purpose: row.purpose,
    status: row.status,
    notes: row.notes ?? undefined,
    rejectionReason: row.rejectionReason ?? undefined,
    receivedBy: row.receivedBy ?? undefined,
    history,
    lines: lines.map(toLineDTO),
    allocations: allocDtos,
    totalCost: money(totalCost),
    approvedAt: row.approvedAt
      ? row.approvedAt instanceof Date
        ? row.approvedAt.toISOString()
        : String(row.approvedAt)
      : undefined,
    approvedByName: row.approvedByName ?? undefined,
    releasedAt: row.releasedAt
      ? row.releasedAt instanceof Date
        ? row.releasedAt.toISOString()
        : String(row.releasedAt)
      : undefined,
    releasedByName: row.releasedByName ?? undefined,
    requestedAt:
      row.requestedAt instanceof Date
        ? row.requestedAt.toISOString()
        : String(row.requestedAt),
    relativeTime: formatRelativeTime(row.requestedAt),
  };
}

function historyEntry(
  action: ConsumableRequestHistoryEntry["action"],
  actor: string,
  note?: string
): ConsumableRequestHistoryEntry {
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

export class ConsumableRequestService {
  constructor(
    private readonly repo = new ConsumableRequestRepository(),
    private readonly consumables = new ConsumableRepository(),
    private readonly purchaseLots = new PurchaseLotService(),
    private readonly auditLogs = new AuditLogRepository(),
    private readonly movements = new StockMovementService()
  ) {}

  private async hydrate(
    row: ConsumableRequestRow
  ): Promise<ConsumableRequestDTO> {
    const [lines, allocations] = await Promise.all([
      this.repo.listLinesByRequestId(row.id),
      row.status === "released"
        ? this.repo.listAllocationsByRequestId(row.id)
        : Promise.resolve([]),
    ]);
    return toDTO(row, lines, allocations);
  }

  async list(
    rawQuery: unknown,
    actor?: ActorContext
  ): Promise<{ data: ConsumableRequestDTO[]; meta: PaginatedMeta }> {
    const filters = listConsumableRequestsQuerySchema.parse(rawQuery ?? {});
    if (actor && !isAssetOperatorRole(actor.role)) {
      filters.requesterUserId = actor.userId;
    }

    const { page, limit, ...countFilters } = filters;
    const [rows, total, counts] = await Promise.all([
      this.repo.list(filters),
      this.repo.count(filters),
      this.repo.countByStatus(countFilters),
    ]);

    const allLines = await this.repo.listLinesByRequestIds(rows.map((r) => r.id));
    const linesByRequest = new Map<string, ConsumableRequestLineRow[]>();
    for (const line of allLines) {
      const list = linesByRequest.get(line.requestId) ?? [];
      list.push(line);
      linesByRequest.set(line.requestId, list);
    }

    return {
      data: rows.map((row) =>
        toDTO(row, linesByRequest.get(row.id) ?? [], [])
      ),
      meta: {
        total,
        page: page || 1,
        limit: limit || 20,
        totalPages: Math.ceil(total / (limit || 20)),
        counts,
      },
    };
  }

  async getById(
    rawId: string,
    actor?: ActorContext
  ): Promise<ConsumableRequestDTO> {
    const id = consumableRequestIdSchema.parse(rawId);
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError("Consumable request", id);
    if (
      actor &&
      !isAssetOperatorRole(actor.role) &&
      row.requesterUserId !== actor.userId
    ) {
      throw new ForbiddenError("You are not allowed to view this request.");
    }
    return this.hydrate(row);
  }

  async create(
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ConsumableRequestDTO> {
    const input = createConsumableRequestSchema.parse(rawInput);

    const consumableIds = input.lines.map((l) => l.consumableId);
    const uniqueIds = new Set(consumableIds);
    if (uniqueIds.size !== consumableIds.length) {
      throw new BadRequestError(
        "Duplicate products in one request are not allowed. Combine quantities into a single line."
      );
    }

    const items = await Promise.all(
      input.lines.map(async (line) => {
        const item = await this.consumables.findById(line.consumableId);
        if (!item) {
          throw new NotFoundError("Consumable", line.consumableId);
        }
        return { line, item };
      })
    );

    const requesterUserId = isAssetOperatorRole(actor.role)
      ? (input.requesterUserId ?? actor.userId)
      : actor.userId;

    const requestCode = generateOperationalCode("CRQ");
    const submitted = historyEntry(
      "submitted",
      actor.displayName,
      "Consumable request recorded"
    );

    if (input.projectId && !isAssetOperatorRole(actor.role)) {
      throw new ForbiddenError(
        "Department accounts cannot request supplies for a project."
      );
    }

    if (
      isAssetOperatorRole(actor.role) &&
      !input.departmentId &&
      !input.projectId
    ) {
      throw new BadRequestError(
        "Specify a department or project destination."
      );
    }

    const dest = await resolveDepartmentSnapshot({
      actor,
      submittedDepartmentId: input.projectId ? null : input.departmentId,
      requireDepartment: !input.projectId,
    });

    const dto = await withTransaction(async (tx) => {
      const created = await this.repo.create(
        {
          requestCode,
          requesterUserId,
          requesterName: input.requesterName,
          requesterEmail: input.requesterEmail.toLowerCase(),
          requesterPhone: input.requesterPhone ?? "",
          department: dest.departmentName ?? "",
          departmentId: dest.departmentId,
          projectId: isAssetOperatorRole(actor.role)
            ? (input.projectId ?? null)
            : null,
          source: isAssetOperatorRole(actor.role) ? "admin_manual" : "portal",
          requestedByName: input.requestedByName ?? null,
          purpose: input.purpose,
          status: "pending",
          notes: input.notes ?? null,
          rejectionReason: null,
          history: [submitted],
          requestedAt: new Date(),
        },
        tx
      );

      const lines = await this.repo.createLines(
        items.map(({ line, item }, index) => ({
          requestId: created.id,
          lineNo: index + 1,
          consumableId: item.id,
          itemCode: item.itemCode,
          itemName: item.name,
          category: item.category,
          unit: item.unit,
          quantityRequested: line.quantity,
          notes: line.notes ?? null,
        })),
        tx
      );

      await this.auditLogs.create(
        {
          entityType: "consumable_request",
          entityId: created.id,
          action: "submitted",
          actorName: actor.displayName,
          actorUserId: actor.userId,
          notes: `${lines.length} line(s)`,
          metadata: {
            requestCode,
            lineCount: lines.length,
            department: dest.departmentName ?? "",
          },
        },
        tx
      );

      return toDTO(created, lines, []);
    });

    return dto;
  }

  async approve(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ConsumableRequestDTO> {
    const id = consumableRequestIdSchema.parse(rawId);
    const input = approveConsumableRequestSchema.parse(rawInput ?? {});
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Consumable request", id);
    if (existing.status !== "pending") {
      throw new ConflictError("Only pending requests can be approved.");
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("approved", actor.displayName, input.note),
    ];

    const updated = await withTransaction(async (tx) => {
      const up = await this.repo.update(
        id,
        {
          status: "approved",
          approvedAt: new Date(),
          approvedByUserId: actor.userId,
          approvedByName: actor.displayName,
          history,
        },
        tx
      );
      if (!up) throw new NotFoundError("Consumable request", id);

      await this.auditLogs.create(
        {
          entityType: "consumable_request",
          entityId: up.id,
          action: "approved",
          actorName: actor.displayName,
          actorUserId: actor.userId,
          notes: input.note,
        },
        tx
      );

      return up;
    });

    return this.hydrate(updated);
  }

  async reject(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ConsumableRequestDTO> {
    const id = consumableRequestIdSchema.parse(rawId);
    const input = rejectConsumableRequestSchema.parse(rawInput);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Consumable request", id);
    if (existing.status !== "pending") {
      throw new ConflictError("Only pending requests can be rejected.");
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("rejected", actor.displayName, input.reason),
    ];

    const updated = await withTransaction(async (tx) => {
      const up = await this.repo.update(
        id,
        {
          status: "rejected",
          rejectionReason: input.reason,
          history,
        },
        tx
      );
      if (!up) throw new NotFoundError("Consumable request", id);

      await this.auditLogs.create(
        {
          entityType: "consumable_request",
          entityId: up.id,
          action: "rejected",
          actorName: actor.displayName,
          actorUserId: actor.userId,
          notes: input.reason,
        },
        tx
      );

      return up;
    });

    return this.hydrate(updated);
  }

  async cancel(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ConsumableRequestDTO> {
    const id = consumableRequestIdSchema.parse(rawId);
    const input = cancelConsumableRequestSchema.parse(rawInput ?? {});
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Consumable request", id);
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
      if (!up) throw new NotFoundError("Consumable request", id);

      await this.auditLogs.create(
        {
          entityType: "consumable_request",
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

    return this.hydrate(updated);
  }

  /**
   * Full issue: every request line must be covered exactly once.
   * Admin picks lots (no FIFO). Deducts lot remainders + item qty.
   */
  async release(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ConsumableRequestDTO> {
    const id = consumableRequestIdSchema.parse(rawId);
    const input = releaseConsumableRequestSchema.parse(rawInput);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Consumable request", id);
    if (existing.status !== "approved") {
      throw new ConflictError("Only approved requests can be released.");
    }

    const dbLines = await this.repo.listLinesByRequestId(id);
    if (dbLines.length === 0) {
      throw new BadRequestError("Request has no product lines.");
    }

    const releaseByLineId = new Map(
      input.lines.map((l) => [l.lineId, l] as const)
    );
    if (releaseByLineId.size !== input.lines.length) {
      throw new BadRequestError("Duplicate lineId in release payload.");
    }
    if (releaseByLineId.size !== dbLines.length) {
      throw new BadRequestError(
        `Release must include every request line exactly once (${dbLines.length} expected).`
      );
    }
    for (const line of dbLines) {
      if (!releaseByLineId.has(line.id)) {
        throw new BadRequestError(
          `Missing release allocations for line ${line.lineNo} (${line.itemCode}).`
        );
      }
    }

    const noteWithReceiver = input.note
      ? `Released to: ${input.receivedBy}. ${input.note}`
      : `Released to: ${input.receivedBy}`;

    const dto = await withTransaction(async (tx) => {
      const allocationRows: Array<{
        requestId: string;
        requestLineId: string;
        consumableId: string;
        purchaseLotId: string | null;
        lotCode: string | null;
        supplierId: string | null;
        supplierName: string | null;
        quantity: number;
        unitCost: string;
        lineTotal: string;
        releasedAt: Date;
        releasedByUserId: string;
        releasedByName: string;
      }> = [];

      for (const line of dbLines) {
        const releaseLine = releaseByLineId.get(line.id)!;
        const item = await this.consumables.findByIdForUpdate(
          line.consumableId,
          tx
        );
        if (!item) {
          throw new NotFoundError("Consumable", line.consumableId);
        }

        if (item.currentQty < line.quantityRequested) {
          throw new BadRequestError(
            `Not on hand for ${item.itemCode}. Available: ${item.currentQty} ${item.unit}, requested: ${line.quantityRequested}. Restock first. Purchase orders will be added later.`
          );
        }

        let lotAllocations: LotCostAllocation[] = [];
        const allocations = releaseLine.allocations ?? [];
        const allocatedQty = allocations.reduce(
          (sum, a) => sum + a.quantity,
          0
        );
        if (allocatedQty !== line.quantityRequested) {
          throw new BadRequestError(
            `Line ${line.lineNo} (${item.itemCode}): allocations must total ${line.quantityRequested} (got ${allocatedQty}).`
          );
        }

        for (const alloc of allocations) {
          const result = alloc.lotId
            ? await this.purchaseLots.consumeFromLotId(
                alloc.lotId,
                alloc.quantity,
                tx,
                item.id
              )
            : await this.purchaseLots.consumeFromLot(
                alloc.lotCode!,
                alloc.quantity,
                tx,
                item.id
              );

          lotAllocations.push(result.allocation);
        }

        const totalCost = lotAllocations.reduce(
          (sum, a) => sum + Number(a.total),
          0
        );
        const primary =
          lotAllocations.find((a) => !a.uncosted) ?? lotAllocations[0];

        const history = [
          ...(Array.isArray(item.history) ? item.history : []),
          stockHistoryEntry(
            "checkout",
            -line.quantityRequested,
            actor.displayName,
            `Request ${existing.requestCode}`,
            noteWithReceiver,
            {
              unitCost: primary?.unitCost,
              supplierId: primary?.supplierId ?? undefined,
              supplierName: primary?.supplierName ?? undefined,
              lotCode: primary?.lotCode ?? undefined,
              totalCost: money(totalCost),
              lotAllocations,
              recipientName: input.receivedBy,
            }
          ),
        ];

        await this.consumables.update(
          item.id,
          {
            currentQty: item.currentQty - line.quantityRequested,
            history,
          },
          tx
        );

        await this.movements.record(
          {
            consumableId: item.id,
            direction: "out",
            reason: "issue",
            actor,
            departmentId: existing.departmentId,
            projectId: existing.projectId,
            requestId: existing.id,
            notes: noteWithReceiver,
            lines: allocationsToMovementLines(lotAllocations),
          },
          tx
        );

        for (const a of lotAllocations) {
          allocationRows.push({
            requestId: existing.id,
            requestLineId: line.id,
            consumableId: item.id,
            purchaseLotId: a.lotId,
            lotCode: a.lotCode,
            supplierId: a.supplierId ?? null,
            supplierName: a.supplierName ?? null,
            quantity: a.quantity,
            unitCost: a.unitCost,
            lineTotal: a.total,
            releasedAt: new Date(),
            releasedByUserId: actor.userId,
            releasedByName: actor.displayName,
          });
        }
      }

      const savedAllocations = await this.repo.createAllocations(
        allocationRows,
        tx
      );

      const history = [
        ...(Array.isArray(existing.history) ? existing.history : []),
        historyEntry("released", actor.displayName, noteWithReceiver),
      ];

      const up = await this.repo.update(
        id,
        {
          status: "released",
          receivedBy: input.receivedBy,
          releasedAt: new Date(),
          releasedByUserId: actor.userId,
          releasedByName: actor.displayName,
          history,
        },
        tx
      );
      if (!up) throw new NotFoundError("Consumable request", id);

      const expenseTotal = savedAllocations.reduce(
        (sum, a) => sum + Number(a.lineTotal),
        0
      );

      await this.auditLogs.create(
        {
          entityType: "consumable_request",
          entityId: up.id,
          action: "released",
          actorName: actor.displayName,
          actorUserId: actor.userId,
          notes: noteWithReceiver,
          metadata: {
            requestCode: existing.requestCode,
            department: existing.department,
            totalCost: money(expenseTotal),
            allocationCount: savedAllocations.length,
          },
        },
        tx
      );

      const lines = await this.repo.listLinesByRequestId(id, tx);
      return toDTO(up, lines, savedAllocations);
    });

    return dto;
  }
}
