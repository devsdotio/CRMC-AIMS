import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import {
  maintenanceLogs,
  type MaintenanceLogRow,
  type NewMaintenanceLogRow,
} from "@/server/db/schema";

import type {
  IMaintenanceRepository,
  ListMaintenanceFilters,
} from "./maintenance.types";

export class MaintenanceRepository implements IMaintenanceRepository {
  async findById(id: string): Promise<MaintenanceLogRow | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.id, id))
      .limit(1);
    return row ?? null;
  }

  async list(filters: ListMaintenanceFilters = {}): Promise<MaintenanceLogRow[]> {
    const db = getDb();
    const conditions = [];

    if (filters.openOnly) {
      conditions.push(eq(maintenanceLogs.isResolved, false));
    }
    if (filters.condition) {
      conditions.push(eq(maintenanceLogs.condition, filters.condition));
    }
    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(maintenanceLogs.assetCode, q),
          ilike(maintenanceLogs.assetName, q),
          ilike(maintenanceLogs.logCode, q),
          ilike(maintenanceLogs.notes, q)
        )!
      );
    }

    const base = db
      .select()
      .from(maintenanceLogs)
      .orderBy(desc(maintenanceLogs.dateLogged));

    if (conditions.length === 0) return base;
    return base.where(and(...conditions));
  }

  async countOpen(): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ value: count() })
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.isResolved, false));
    return Number(row?.value ?? 0);
  }

  async countYear(): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ value: count() })
      .from(maintenanceLogs)
      .where(
        sql`extract(year from ${maintenanceLogs.createdAt}) = extract(year from now())`
      );
    return Number(row?.value ?? 0);
  }

  async create(
    data: Omit<NewMaintenanceLogRow, "id" | "createdAt" | "updatedAt">
  ): Promise<MaintenanceLogRow> {
    const db = getDb();
    const [row] = await db.insert(maintenanceLogs).values(data).returning();
    if (!row) throw new Error("Failed to create maintenance log.");
    return row;
  }

  async update(
    id: string,
    data: Partial<Omit<MaintenanceLogRow, "id" | "createdAt" | "logCode">>
  ): Promise<MaintenanceLogRow | null> {
    const db = getDb();
    const [row] = await db
      .update(maintenanceLogs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(maintenanceLogs.id, id))
      .returning();
    return row ?? null;
  }
}
