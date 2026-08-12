import type {
  BorrowRequestHistoryEntry,
  BorrowRequestRow,
} from "@/server/db/schema";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { generateOperationalCode, isoNow } from "@/server/shared/codes";
import type { ActorContext } from "@/server/shared/auth";
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

function toDTO(row: BorrowRequestRow): BorrowRequestDTO {
  const history = Array.isArray(row.history) ? row.history : [];
  return {
    id: row.id,
    requestCode: row.requestCode,
    requesterName: row.requesterName,
    requesterEmail: row.requesterEmail,
    requesterPhone: row.requesterPhone,
    department: row.department,
    itemDescription: row.itemDescription,
    assetCode: row.assetCode ?? undefined,
    category: row.category,
    quantity: row.quantity,
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
    private readonly borrowLogRepo = new BorrowLogRepository()
  ) {}

  async list(
    rawQuery: unknown,
    actor?: ActorContext
  ): Promise<{ data: BorrowRequestDTO[]; meta: PaginatedMeta }> {
    const filters = listBorrowRequestsQuerySchema.parse(rawQuery ?? {});
    if (actor && !isAssetOperatorRole(actor.role)) {
      filters.requesterUserId = actor.userId;
    }
    
    const { page, limit, ...countFilters } = filters;
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
        itemDescription: input.itemDescription,
        assetId: input.assetId ?? null,
        assetCode: input.assetCode ?? null,
        category: input.category,
        quantity: input.quantity,
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

    const assetToAssignId = input.assetId ?? existing.assetId;
    if (assetToAssignId) {
      const asset = await this.assetRepo.findById(assetToAssignId);
      if (asset && asset.currentHolder) {
        throw new ConflictError(`Cannot approve: Asset is currently borrowed by ${asset.currentHolder}. It will remain in pending status until available.`);
      }
      if (asset && asset.assignmentType === "assignable") {
        throw new BadRequestError(
          "This asset is project-assignable and cannot be approved for borrow checkout."
        );
      }
    }

    const updated = await withTransaction(async (tx) => {
      const up = await this.repo.update(id, {
        status: "approved",
        assetId: input.assetId ?? existing.assetId,
        assetCode: input.assetCode ?? existing.assetCode,
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

    // Open accountable borrow log first while request is still approved.
    if (existing.assetId) {
      const asset = await this.assetRepo.findById(existing.assetId);
      if (!asset) throw new NotFoundError("Asset", existing.assetId);
      if (asset.assignmentType === "assignable") {
        throw new BadRequestError(
          "This asset is project-assignable and cannot be released as a borrow checkout."
        );
      }
      await this.borrowLogs.release(
        {
          assetId: existing.assetId,
          requestId: existing.id,
          borrowerName: input.pickedUpBy,
          borrowerEmail: existing.requesterEmail,
          borrowerPhone: existing.requesterPhone || "",
          department: existing.department,
          dueDate: existing.expectedReturnDate,
          notes: noteWithPicker,
          borrowerUserId: existing.requesterUserId ?? undefined,
        },
        actor
      );
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("released", actor.displayName, noteWithPicker),
    ];

    const updated = await withTransaction(async (tx) => {
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

      if (up.assetId) {
        await this.assetRepo.update(up.assetId, { currentHolder: null }, tx);
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
      throw new BadRequestError("Only released requests can be marked returned.");
    }

    const noteWithReturner = input.note
      ? `Returned by: ${input.returnedBy}. ${input.note}`
      : `Returned by: ${input.returnedBy}`;

    // Close active borrow log (clears holder + lifecycle) when this request released an asset.
    if (existing.assetId) {
      const open = await this.borrowLogRepo.findActiveByAssetId(existing.assetId);
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
        const asset = await this.assetRepo.findById(existing.assetId);
        if (asset?.currentHolder) {
          await this.assetRepo.update(existing.assetId, {
            currentHolder: null,
            lastUpdated: new Date(),
          });
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
