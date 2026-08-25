import type {
  BorrowRequestHistoryEntry,
  BorrowRequestRow,
} from "@/server/db/schema";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  generateOperationalCode,
  isoNow,
} from "@/server/shared/codes";
import type { ActorContext } from "@/server/shared/auth";
import { resolveDepartmentSnapshot } from "@/server/shared/auth";
import { isAssetOperatorRole } from "@/server/shared/roles";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "@/server/shared/errors";

import { BorrowRequestRepository } from "./borrow-request.repository";
import type {
  BorrowRequestDTO,
  IBorrowRequestRepository,
} from "./borrow-request.types";
import { AssetRepository } from "../assets/asset.repository";
import { AuditLogRepository } from "../audit-logs/audit-logs.repository";
import { BorrowLogService } from "../borrow-log/borrow-log.service";
import { BorrowLogRepository } from "../borrow-log/borrow-log.repository";
import { DepartmentRepository } from "../departments/department.repository";
import { ProjectAssetAssignmentRepository } from "../projects/project-asset.repository";
import { withTransaction, type DbSession } from "@/server/db/transaction";
import type { AssetRow } from "@/server/db/schema";
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
  updateBorrowRequestSchema,
} from "./borrow-request.validation";

function toDTO(row: BorrowRequestRow): BorrowRequestDTO {
  const history = Array.isArray(row.history) ? row.history : [];
  return {
    id: row.id,
    requestCode: row.requestCode,
    requesterName: row.requesterName,
    requesterEmail: row.requesterEmail,
    requesterPhone: row.requesterPhone,
    department: row.department,
    departmentId: row.departmentId,
    requestType: row.requestType ?? undefined,
    requestedByName: row.requestedByName ?? undefined,
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

type RequestAssetItem = BorrowRequestRow["items"][number];

function normalizeCategoryOnlyItems(
  items: RequestAssetItem[]
): RequestAssetItem[] {
  return items.map((item) => ({
    itemDescription: item.itemDescription,
    category: item.category,
    quantity: item.quantity,
    itemType: "asset" as const,
  }));
}

function expandItemsWithIssuedAssets(
  items: RequestAssetItem[],
  allocations: { lineIndex: number; assetIds: string[] }[],
  assetsById: Map<string, { assetCode: string; name: string }>
): RequestAssetItem[] {
  const expanded: RequestAssetItem[] = [];

  for (let lineIndex = 0; lineIndex < items.length; lineIndex++) {
    const item = items[lineIndex];
    const allocation = allocations.find((a) => a.lineIndex === lineIndex);
    if (!allocation) {
      expanded.push(item);
      continue;
    }

    for (const assetId of allocation.assetIds) {
      const asset = assetsById.get(assetId);
      if (!asset) continue;
      expanded.push({
        itemDescription: asset.name,
        assetId,
        assetCode: asset.assetCode,
        category: item.category,
        quantity: 1,
        itemType: "asset",
      });
    }
  }

  return expanded;
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
    private readonly departments = new DepartmentRepository(),
    private readonly projectAssignments = new ProjectAssetAssignmentRepository()
  ) {}

  /** Shared gate: unit must be free of holder, reservation, and open project custody. */
  private async assertAssetFreeForRequest(
    asset: AssetRow,
    opts?: { allowReservedForRequestId?: string }
  ): Promise<void> {
    if (asset.status !== "active") {
      throw new ConflictError(
        `Asset ${asset.assetCode} is not available (${asset.status.replace(/_/g, " ")}).`
      );
    }
    if (asset.currentHolder) {
      throw new ConflictError(
        `Asset ${asset.assetCode} is currently in custody (${asset.currentHolder}).`
      );
    }
    if (
      asset.reservedForRequestId &&
      asset.reservedForRequestId !== opts?.allowReservedForRequestId
    ) {
      throw new ConflictError(
        opts?.allowReservedForRequestId
          ? `Asset ${asset.assetCode} is reserved for another request.`
          : `Asset ${asset.assetCode} is already reserved for an approved request.`
      );
    }
    const openProject = await this.projectAssignments.findOpenByAssetId(asset.id);
    if (openProject) {
      throw new ConflictError(
        `Asset ${asset.assetCode} is assigned to a project. Return it from the project panel first.`
      );
    }
    const openBorrow = await this.borrowLogRepo.findActiveByAssetId(asset.id);
    if (openBorrow) {
      throw new ConflictError(
        `Asset ${asset.assetCode} already has an active custody log. Return it first.`
      );
    }
  }

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

    const dest = await resolveDepartmentSnapshot({
      actor,
      submittedDepartmentId: input.departmentId,
      requireDepartment: true,
    });

    const submitted = historyEntry("submitted", actor.displayName, "Request recorded");

    const requestType = input.requestType ?? "borrowable";

    for (const item of input.items) {
      if (!item.assetId) continue;
      const asset = await this.assetRepo.findById(item.assetId);
      if (!asset) throw new NotFoundError("Asset", item.assetId);
      await this.assertAssetFreeForRequest(asset);
      if (requestType === "borrowable" && asset.assignmentType !== "borrowable") {
        throw new ConflictError(`Asset ${asset.assetCode} is not borrowable.`);
      }
      if (requestType === "assignable" && asset.assignmentType !== "assignable") {
        throw new ConflictError(`Asset ${asset.assetCode} is not assignable.`);
      }
    }

    const row = await withTransaction(async (tx) => {
      const created = await this.repo.create({
        requestCode,
        requesterUserId,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail.toLowerCase(),
        requesterPhone: input.requesterPhone ?? "",
        department: dest.departmentName!,
        departmentId: dest.departmentId,
        requestType,
        requestedByName: input.requestedByName ?? null,
        items: input.items,
        purpose: input.purpose,
        expectedReturnDate:
          requestType === "borrowable"
            ? (input.expectedReturnDate ?? new Date().toISOString().slice(0, 10))
            : null,
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

    const nextItems = normalizeCategoryOnlyItems(
      input.items ?? existing.items
    );

    const quantityChanged =
      Boolean(input.items) &&
      nextItems.some((item, idx) => {
        const prior = existing.items[idx];
        return !prior || prior.quantity !== item.quantity;
      });

    const approveNote = input.note?.trim();
    const historyNote = quantityChanged
      ? approveNote
        ? `${approveNote} (quantities adjusted at approval)`
        : "Quantities adjusted at approval"
      : approveNote;

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("approved", actor.displayName, historyNote),
    ];

    const updated = await withTransaction(async (tx) => {
      const up = await this.repo.update(
        id,
        {
          status: "approved",
          items: nextItems,
          history,
        },
        tx
      );
      if (!up) throw new NotFoundError("Borrow request", id);

      // Lock pre-picked units so walk-up issue cannot steal them before release.
      for (const item of nextItems) {
        if (!item.assetId) continue;
        await this.assetRepo.update(
          item.assetId,
          { reservedForRequestId: id, lastUpdated: new Date() },
          tx
        );
      }

      await this.auditLogs.create({
        entityType: "borrow_request",
        entityId: up.id,
        action: "approved",
        actorName: actor.displayName,
        actorUserId: actor.userId,
        notes: historyNote,
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

    const mixedSupply = existing.items.some(
      (item) => item.itemType === "consumable" || Boolean(item.consumableId)
    );
    if (mixedSupply) {
      throw new ConflictError(
        "This request includes supplies. Release it from Supply requests — coded-asset requests cannot mix consumables."
      );
    }

    const requestType = existing.requestType ?? "borrowable";
    const expectedAssignmentType =
      requestType === "assignable" ? "assignable" : "borrowable";

    if (input.lineAllocations.length !== existing.items.length) {
      throw new BadRequestError(
        "Provide asset selections for every requested line before releasing."
      );
    }

    const seenAssetIds = new Set<string>();
    const assetsById = new Map<
      string,
      Awaited<ReturnType<AssetRepository["findById"]>>
    >();

    for (const allocation of input.lineAllocations) {
      const line = existing.items[allocation.lineIndex];
      if (!line) {
        throw new BadRequestError(
          `Invalid line index ${allocation.lineIndex} in release allocation.`
        );
      }
      if (allocation.assetIds.length !== line.quantity) {
        throw new BadRequestError(
          `Line "${line.itemDescription}" requires ${line.quantity} unit(s); ${allocation.assetIds.length} selected.`
        );
      }

      for (const assetId of allocation.assetIds) {
        if (seenAssetIds.has(assetId)) {
          throw new ConflictError("Each asset can only be issued once per release.");
        }
        seenAssetIds.add(assetId);

        const asset = await this.assetRepo.findById(assetId);
        if (!asset) throw new NotFoundError("Asset", assetId);
        await this.assertAssetFreeForRequest(asset, {
          allowReservedForRequestId: existing.id,
        });
        if (asset.assignmentType !== expectedAssignmentType) {
          throw new ConflictError(
            `Asset ${asset.assetCode} is not ${expectedAssignmentType}.`
          );
        }
        if (asset.category !== line.category) {
          throw new ConflictError(
            `Asset ${asset.assetCode} is in category "${asset.category}", expected "${line.category}".`
          );
        }

        assetsById.set(assetId, asset);
      }
    }

    const noteWithPicker = input.note
      ? `Released to: ${input.pickedUpBy}. ${input.note}`
      : `Released to: ${input.pickedUpBy}`;

    const custodyKind = requestType === "assignable" ? "assignment" : "borrow";

    let departmentId = existing.departmentId ?? null;
    if (!departmentId && existing.department.trim()) {
      const dept = await this.departments.findByNameLower(
        existing.department.trim()
      );
      departmentId = dept?.id ?? null;
    }
    if (!departmentId) {
      throw new BadRequestError(
        "This request is not linked to a department. Update the department record before releasing."
      );
    }

    const issuedItems = expandItemsWithIssuedAssets(
      existing.items,
      input.lineAllocations,
      new Map(
        [...assetsById.entries()].map(([assetId, asset]) => [
          assetId,
          { assetCode: asset!.assetCode, name: asset!.name },
        ])
      )
    );

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("released", actor.displayName, noteWithPicker),
    ];

    const updated = await withTransaction(async (tx: DbSession) => {
      for (const allocation of input.lineAllocations) {
        for (const assetId of allocation.assetIds) {
          await this.borrowLogs.release(
            {
              assetId,
              requestId: existing.id,
              custodyKind,
              source: "portal",
              departmentId,
              borrowerName: input.pickedUpBy,
              borrowerEmail: existing.requesterEmail,
              borrowerPhone: existing.requesterPhone || "",
              dueDate:
                custodyKind === "borrow"
                  ? (existing.expectedReturnDate ?? this.borrowLogs.defaultDueDate())
                  : null,
              requestedByName: existing.requestedByName ?? input.pickedUpBy,
              notes: noteWithPicker,
              borrowerUserId: existing.requesterUserId ?? undefined,
            },
            actor,
            tx
          );
        }
      }

      const up = await this.repo.update(
        id,
        {
          status: "released",
          pickedUpBy: input.pickedUpBy,
          items: issuedItems,
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
            issuedAssetIds: [...seenAssetIds],
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
          await this.assetRepo.update(
            item.assetId,
            { currentHolder: null, reservedForRequestId: null, lastUpdated: new Date() },
            tx
          );
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
          // Legacy release without log — clear holder + any orphan project row.
          const asset = await this.assetRepo.findById(item.assetId);
          if (asset?.currentHolder) {
            await this.assetRepo.update(item.assetId, {
              currentHolder: null,
              reservedForRequestId: null,
              lastUpdated: new Date(),
            });
          }
          const openProject = await this.projectAssignments.findOpenByAssetId(
            item.assetId
          );
          if (openProject) {
            await this.projectAssignments.update(openProject.id, {
              status: "returned",
              returnedAt: new Date(),
              returnedByUserId: actor.userId,
              returnedByName: actor.displayName,
              returnNotes: noteWithReturner,
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

  async update(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<BorrowRequestDTO> {
    const id = borrowRequestIdSchema.parse(rawId);
    const input = updateBorrowRequestSchema.parse(rawInput);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Borrow request", id);
    if (existing.status !== "pending") {
      throw new ConflictError("Only pending requests can be edited.");
    }

    let departmentName = existing.department;
    let departmentId = existing.departmentId;
    if (input.departmentId !== undefined) {
      if (input.departmentId) {
        const d = await this.departments.findById(input.departmentId);
        if (!d) throw new NotFoundError("Department", input.departmentId);
        departmentName = d.name;
        departmentId = d.id;
      } else {
        departmentId = null;
      }
    }

    const nextRequestType = input.requestType ?? existing.requestType ?? "borrowable";
    const nextItems = input.items ?? existing.items;

    // Validate assets if changed or present
    if (input.items) {
      for (const item of nextItems) {
        if (!item.assetId) continue;
        const asset = await this.assetRepo.findById(item.assetId);
        if (!asset) throw new NotFoundError("Asset", item.assetId);
        await this.assertAssetFreeForRequest(asset, {
          allowReservedForRequestId: existing.id,
        });
        if (nextRequestType === "borrowable" && asset.assignmentType !== "borrowable") {
          throw new ConflictError(`Asset ${asset.assetCode} is not borrowable.`);
        }
        if (nextRequestType === "assignable" && asset.assignmentType !== "assignable") {
          throw new ConflictError(`Asset ${asset.assetCode} is not assignable.`);
        }
      }
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("edited", actor.displayName, input.editReason),
    ];

    const updated = await withTransaction(async (tx) => {

      const up = await this.repo.update(
        id,
        {
          ...(input.requesterName !== undefined ? { requesterName: input.requesterName } : {}),
          ...(input.requesterEmail !== undefined ? { requesterEmail: input.requesterEmail.toLowerCase() } : {}),
          ...(input.requesterPhone !== undefined ? { requesterPhone: input.requesterPhone } : {}),
          ...(input.requestedByName !== undefined ? { requestedByName: input.requestedByName } : {}),
          department: departmentName,
          departmentId,
          requestType: nextRequestType,
          items: nextItems,
          ...(input.purpose !== undefined ? { purpose: input.purpose } : {}),
          expectedReturnDate:
            nextRequestType === "borrowable"
              ? (input.expectedReturnDate !== undefined ? input.expectedReturnDate : existing.expectedReturnDate)
              : null,
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          history,
          updatedAt: new Date(),
        },
        tx
      );
      if (!up) throw new NotFoundError("Borrow request", id);

      await this.auditLogs.create(
        {
          entityType: "borrow_request",
          entityId: up.id,
          action: "update",
          actorName: actor.displayName,
          actorUserId: actor.userId,
          notes: input.editReason,
        },
        tx
      );

      return up;
    });

    return toDTO(updated);
  }
}
