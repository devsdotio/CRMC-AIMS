import { and, count, desc, eq, ilike, lt, or, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import {
  borrowTransactions,
  type BorrowTransactionRow,
  type NewBorrowTransactionRow,
} from "@/server/db/schema";
import { todayDateString } from "@/server/shared/codes";

import type {
  IBorrowLogRepository,
  ListBorrowLogFilters,
} from "./borrow-log.types";

export class BorrowLogRepository implements IBorrowLogRepository {
  async findById(id: string): Promise<BorrowTransactionRow | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(borrowTransactions)
      .where(eq(borrowTransactions.id, id))
      .limit(1);
    return row ?? null;
  }

  async findActiveByAssetId(
    assetId: string
  ): Promise<BorrowTransactionRow | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(borrowTransactions)
      .where(
        and(
          eq(borrowTransactions.assetId, assetId),
          eq(borrowTransactions.status, "active")
        )
      )
      .limit(1);
    return row ?? null;
  }

  async list(filters: ListBorrowLogFilters = {}): Promise<BorrowTransactionRow[]> {
    const db = getDb();
    const conditions = [];
    const today = todayDateString();

    if (filters.status === "returned") {
      conditions.push(eq(borrowTransactions.status, "returned"));
    } else if (filters.status === "active") {
      conditions.push(eq(borrowTransactions.status, "active"));
      // not overdue: due_date >= today
      conditions.push(sql`${borrowTransactions.dueDate} >= ${today}`);
    } else if (filters.status === "overdue") {
      conditions.push(eq(borrowTransactions.status, "active"));
      conditions.push(lt(borrowTransactions.dueDate, today));
    }

    if (filters.department?.trim()) {
      conditions.push(eq(borrowTransactions.department, filters.department.trim()));
    }
    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(borrowTransactions.borrowerName, q),
          ilike(borrowTransactions.logCode, q),
          ilike(borrowTransactions.assetCode, q),
          ilike(borrowTransactions.assetName, q),
          ilike(borrowTransactions.requestCode, q)
        )!
      );
    }

    const base = db
      .select()
      .from(borrowTransactions)
      .orderBy(desc(borrowTransactions.releasedAt));

    if (conditions.length === 0) return base;
    return base.where(and(...conditions));
  }

  async countActive(): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ value: count() })
      .from(borrowTransactions)
      .where(eq(borrowTransactions.status, "active"));
    return Number(row?.value ?? 0);
  }

  async countOverdue(): Promise<number> {
    const db = getDb();
    const today = todayDateString();
    const [row] = await db
      .select({ value: count() })
      .from(borrowTransactions)
      .where(
        and(
          eq(borrowTransactions.status, "active"),
          lt(borrowTransactions.dueDate, today)
        )
      );
    return Number(row?.value ?? 0);
  }

  async countYear(): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ value: count() })
      .from(borrowTransactions)
      .where(
        sql`extract(year from ${borrowTransactions.createdAt}) = extract(year from now())`
      );
    return Number(row?.value ?? 0);
  }

  async create(
    data: Omit<NewBorrowTransactionRow, "id" | "createdAt" | "updatedAt">
  ): Promise<BorrowTransactionRow> {
    const db = getDb();
    const [row] = await db.insert(borrowTransactions).values(data).returning();
    if (!row) throw new Error("Failed to create borrow log.");
    return row;
  }

  async update(
    id: string,
    data: Partial<Omit<BorrowTransactionRow, "id" | "createdAt" | "logCode">>
  ): Promise<BorrowTransactionRow | null> {
    const db = getDb();
    const [row] = await db
      .update(borrowTransactions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(borrowTransactions.id, id))
      .returning();
    return row ?? null;
  }
}
