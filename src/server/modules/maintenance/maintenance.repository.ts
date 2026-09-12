import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import {
  assets,
  maintenanceLogs,
  type MaintenanceLogRow,
  type NewMaintenanceLogRow,
} from "@/server/db/schema";

import type {
  IMaintenanceRepository,
  ListMaintenanceFilters,
} from "./maintenance.types";

export class MaintenanceRepository implements IMaintenanceRepository {
  private db(session?: DbSession) {
    return session ?? getDb();
  }

  async findById(id: string, session?: DbSession): Promise<MaintenanceLogRow | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.id, id))
      .limit(1);
    return row ?? null;
  }

  async list(
    filters: ListMaintenanceFilters = {},
    session?: DbSession
  ): Promise<MaintenanceLogRow[]> {
    const db = this.db(session);
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
    if (!filters.includeSandbox) {
      conditions.push(
        sql`(${maintenanceLogs.assetId} is null OR not exists (
          select 1 from ${assets}
          where ${assets.id} = ${maintenanceLogs.assetId}
            and ${assets.isSandbox} = true
        ))`
      );
    }

    const base = db
      .select()
      .from(maintenanceLogs)
      .orderBy(desc(maintenanceLogs.dateLogged));

    if (conditions.length === 0) return base;
    return base.where(and(...conditions));
  }

  async countOpen(session?: DbSession): Promise<number> {
    const db = this.db(session);
    const [row] = await db
      .select({ value: count() })
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.isResolved, false));
    return Number(row?.value ?? 0);
  }

  async countOpenByAssetId(
    assetId: string,
    session?: DbSession
  ): Promise<number> {
    const db = this.db(session);
    const [row] = await db
      .select({ value: count() })
      .from(maintenanceLogs)
      .where(
        and(
          eq(maintenanceLogs.assetId, assetId),
          eq(maintenanceLogs.isResolved, false)
        )
      );
    return Number(row?.value ?? 0);
  }

  async countYear(session?: DbSession): Promise<number> {
    const db = this.db(session);
    const [row] = await db
      .select({ value: count() })
      .from(maintenanceLogs)
      .where(
        sql`extract(year from ${maintenanceLogs.createdAt}) = extract(year from now())`
      );
    return Number(row?.value ?? 0);
  }

  async create(
    data: Omit<NewMaintenanceLogRow, "id" | "createdAt" | "updatedAt">,
    session?: DbSession
  ): Promise<MaintenanceLogRow> {
    const db = this.db(session);
    const [row] = await db.insert(maintenanceLogs).values(data).returning();
    if (!row) throw new Error("Failed to create maintenance log.");
    return row;
  }

  async update(
    id: string,
    data: Partial<Omit<MaintenanceLogRow, "id" | "createdAt" | "logCode">>,
    session?: DbSession
  ): Promise<MaintenanceLogRow | null> {
    const db = this.db(session);
    const [row] = await db
      .update(maintenanceLogs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(maintenanceLogs.id, id))
      .returning();
    return row ?? null;
  }
}
