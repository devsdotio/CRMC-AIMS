import type {
  BorrowRequestHistoryEntry,
  BorrowRequestRow,
} from "@/server/db/schema";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { generateOperationalCode, isoNow } from "@/server/shared/codes";
import type { ActorContext } from "@/server/shared/auth";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";

import { BorrowRequestRepository } from "./borrow-request.repository";
import type {
  BorrowRequestDTO,
  IBorrowRequestRepository,
} from "./borrow-request.types";
import {
  approveBorrowRequestSchema,
  borrowRequestIdSchema,
  createBorrowRequestSchema,
  listBorrowRequestsQuerySchema,
  rejectBorrowRequestSchema,
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

export class BorrowRequestService {
  constructor(
    private readonly repo: IBorrowRequestRepository = new BorrowRequestRepository()
  ) {}

  async list(rawQuery: unknown): Promise<BorrowRequestDTO[]> {
    const filters = listBorrowRequestsQuerySchema.parse(rawQuery ?? {});
    const rows = await this.repo.list(filters);
    return rows.map(toDTO);
  }

  async getById(rawId: string): Promise<BorrowRequestDTO> {
    const id = borrowRequestIdSchema.parse(rawId);
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError("Borrow request", id);
    return toDTO(row);
  }

  async create(rawInput: unknown, actor: ActorContext): Promise<BorrowRequestDTO> {
    const input = createBorrowRequestSchema.parse(rawInput);
    const requestCode = generateOperationalCode("REQ");

    const submitted = historyEntry("submitted", actor.displayName, "Request recorded");

    const row = await this.repo.create({
      requestCode,
      requesterUserId: input.requesterUserId ?? null,
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

    const updated = await this.repo.update(id, {
      status: "approved",
      assetId: input.assetId ?? existing.assetId,
      assetCode: input.assetCode ?? existing.assetCode,
      history,
    });
    if (!updated) throw new NotFoundError("Borrow request", id);
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

    const updated = await this.repo.update(id, {
      status: "rejected",
      rejectionReason: input.reason,
      history,
    });
    if (!updated) throw new NotFoundError("Borrow request", id);
    return toDTO(updated);
  }

  async markReturned(rawId: string, actor: ActorContext): Promise<BorrowRequestDTO> {
    const id = borrowRequestIdSchema.parse(rawId);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Borrow request", id);
    if (existing.status !== "approved") {
      throw new BadRequestError("Only approved requests can be marked returned.");
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry("returned", actor.displayName),
    ];

    const updated = await this.repo.update(id, {
      status: "returned",
      history,
    });
    if (!updated) throw new NotFoundError("Borrow request", id);
    return toDTO(updated);
  }
}
