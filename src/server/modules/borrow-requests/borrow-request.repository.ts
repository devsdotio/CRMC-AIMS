import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import {
  borrowRequests,
  type BorrowRequestRow,
  type NewBorrowRequestRow,
} from "@/server/db/schema";

import type {
  IBorrowRequestRepository,
  ListBorrowRequestFilters,
} from "./borrow-request.types";

export class BorrowRequestRepository implements IBorrowRequestRepository {
  async findById(id: string): Promise<BorrowRequestRow | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(borrowRequests)
      .where(eq(borrowRequests.id, id))
      .limit(1);
    return row ?? null;
  }

  async list(filters: ListBorrowRequestFilters = {}): Promise<BorrowRequestRow[]> {
    const db = getDb();
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(borrowRequests.status, filters.status));
    }
    if (filters.department?.trim()) {
      conditions.push(eq(borrowRequests.department, filters.department.trim()));
    }
    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(borrowRequests.requesterName, q),
          ilike(borrowRequests.requesterEmail, q),
          ilike(borrowRequests.requestCode, q),
          ilike(borrowRequests.itemDescription, q),
          ilike(borrowRequests.assetCode, q)
        )!
      );
    }

    const base = db.select().from(borrowRequests).orderBy(desc(borrowRequests.requestedAt));
    if (conditions.length === 0) return base;
    return base.where(and(...conditions));
  }

  async countAll(): Promise<number> {
    const db = getDb();
    const [row] = await db.select({ value: count() }).from(borrowRequests);
    return Number(row?.value ?? 0);
  }

  async countPending(): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ value: count() })
      .from(borrowRequests)
      .where(eq(borrowRequests.status, "pending"));
    return Number(row?.value ?? 0);
  }

  async create(
    data: Omit<NewBorrowRequestRow, "id" | "createdAt" | "updatedAt">
  ): Promise<BorrowRequestRow> {
    const db = getDb();
    const [row] = await db.insert(borrowRequests).values(data).returning();
    if (!row) throw new Error("Failed to create borrow request.");
    return row;
  }

  async update(
    id: string,
    data: Partial<Omit<BorrowRequestRow, "id" | "createdAt" | "requestCode">>
  ): Promise<BorrowRequestRow | null> {
    const db = getDb();
    const [row] = await db
      .update(borrowRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(borrowRequests.id, id))
      .returning();
    return row ?? null;
  }
}

/** Next request sequential for the year (best-effort, not lock-free perfect). */
export async function nextBorrowRequestSequence(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ value: count() })
    .from(borrowRequests)
    .where(
      sql`extract(year from ${borrowRequests.createdAt}) = extract(year from now())`
    );
  return Number(row?.value ?? 0) + 1;
}
