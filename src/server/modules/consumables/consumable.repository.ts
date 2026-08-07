import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import {
  consumables,
  type ConsumableRow,
  type NewConsumableRow,
} from "@/server/db/schema";

import type {
  IConsumableRepository,
  ListConsumableFilters,
} from "./consumable.types";

export class ConsumableRepository implements IConsumableRepository {
  async findById(id: string): Promise<ConsumableRow | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(consumables)
      .where(eq(consumables.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByCode(itemCode: string): Promise<ConsumableRow | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(consumables)
      .where(eq(consumables.itemCode, itemCode))
      .limit(1);
    return row ?? null;
  }

  async list(filters: ListConsumableFilters = {}): Promise<ConsumableRow[]> {
    const db = getDb();
    const conditions = [];

    if (filters.category) {
      conditions.push(eq(consumables.category, filters.category));
    }
    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(consumables.name, q),
          ilike(consumables.itemCode, q),
          ilike(consumables.location, q)
        )!
      );
    }

    // stockLevel filtered in service after load for "low" band (needs threshold ratio)
    // critical: qty <= min can be done in SQL
    if (filters.stockLevel === "critical") {
      conditions.push(
        sql`${consumables.currentQty} <= ${consumables.minThreshold}`
      );
    }

    const base = db.select().from(consumables).orderBy(desc(consumables.updatedAt));
    if (conditions.length === 0) return base;
    return base.where(and(...conditions));
  }

  async countYear(): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ value: count() })
      .from(consumables)
      .where(
        sql`extract(year from ${consumables.createdAt}) = extract(year from now())`
      );
    return Number(row?.value ?? 0);
  }

  async countLowStock(): Promise<number> {
    const db = getDb();
    // Low or critical: current_qty <= min * 1.2
    const [row] = await db
      .select({ value: count() })
      .from(consumables)
      .where(
        sql`${consumables.currentQty} <= ceil(${consumables.minThreshold} * 1.2)`
      );
    return Number(row?.value ?? 0);
  }

  async create(
    data: Omit<NewConsumableRow, "id" | "createdAt" | "updatedAt">
  ): Promise<ConsumableRow> {
    const db = getDb();
    const [row] = await db.insert(consumables).values(data).returning();
    if (!row) throw new Error("Failed to create consumable.");
    return row;
  }

  async update(
    id: string,
    data: Partial<Omit<ConsumableRow, "id" | "createdAt" | "itemCode">>
  ): Promise<ConsumableRow | null> {
    const db = getDb();
    const [row] = await db
      .update(consumables)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(consumables.id, id))
      .returning();
    return row ?? null;
  }
}
