import { and, asc, count, eq, ilike, isNull, or, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import {
  assets,
  borrowTransactions,
  projectAssetAssignments,
  type AssetRow,
  type NewAssetRow,
} from "@/server/db/schema";

import type { IAssetRepository, ListAssetsFilters } from "./asset.types";

/**
 * List projection: skips bulky `maintenance_history` JSONB (detail/mutations only).
 */
const assetListColumns = {
  id: assets.id,
  assetCode: assets.assetCode,
  name: assets.name,
  category: assets.category,
  status: assets.status,
  assignmentType: assets.assignmentType,
  modelId: assets.modelId,
  serialNumber: assets.serialNumber,
  location: assets.location,
  currentHolder: assets.currentHolder,
  reservedForRequestId: assets.reservedForRequestId,
  department: assets.department,
  purchaseDate: assets.purchaseDate,
  value: assets.value,
  supplierId: assets.supplierId,
  imageUrl: assets.imageUrl,
  notes: assets.notes,
  lastUpdated: assets.lastUpdated,
  createdAt: assets.createdAt,
  updatedAt: assets.updatedAt,
} as const;

function withEmptyMaintenanceHistory(
  row: Omit<AssetRow, "maintenanceHistory">
): AssetRow {
  return { ...row, maintenanceHistory: [] };
}

/**
 * Data-access only. No validation, no DTO mapping, no domain rules.
 * Methods accept optional `db` so multi-step ops can share a transaction.
 */
export class AssetRepository implements IAssetRepository {
  private db(session?: DbSession) {
    return session ?? getDb();
  }

  async getCategoryDistribution(
    session?: DbSession
  ): Promise<{ category: string; count: number }[]> {
    const db = this.db(session);
    const rows = await db
      .select({
        category: assets.category,
        value: count(),
      })
      .from(assets)
      .groupBy(assets.category);

    return rows.map((r) => ({
      category: r.category,
      count: Number(r.value),
    }));
  }

  async countAssigned(session?: DbSession): Promise<number> {
    const db = this.db(session);
    const [row] = await db
      .select({ val: count() })
      .from(assets)
      .where(
        and(
          eq(assets.assignmentType, "assignable"),
          or(
            sql`${assets.currentHolder} IS NOT NULL`,
            sql`exists (
              select 1 from ${projectAssetAssignments}
              where ${projectAssetAssignments.assetId} = ${assets.id}
                and ${projectAssetAssignments.status} = 'assigned'
            )`
          )
        )
      );
    return Number(row?.val ?? 0);
  }

  async countByType(
    type: "borrowable" | "assignable",
    session?: DbSession
  ): Promise<number> {
    const db = this.db(session);
    const [row] = await db
      .select({ val: count() })
      .from(assets)
      .where(eq(assets.assignmentType, type));
    return Number(row?.val ?? 0);
  }

  async findMany(
    filters?: ListAssetsFilters,
    session?: DbSession
  ): Promise<AssetRow[]> {
    const db = this.db(session);
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(assets.status, filters.status));
    }
    if (filters?.modelId) {
      conditions.push(eq(assets.modelId, filters.modelId));
    }
    if (filters?.category?.trim()) {
      conditions.push(eq(assets.category, filters.category.trim()));
    }
    if (filters?.assignmentType) {
      conditions.push(eq(assets.assignmentType, filters.assignmentType));
    }
    if (filters?.availableOnly) {
      conditions.push(eq(assets.status, "active"));
      conditions.push(isNull(assets.currentHolder));
      // Must match release checks: open project or borrow custody blocks issue/assign.
      conditions.push(
        sql`not exists (
          select 1 from ${projectAssetAssignments}
          where ${projectAssetAssignments.assetId} = ${assets.id}
            and ${projectAssetAssignments.status} = 'assigned'
        )`
      );
      conditions.push(
        sql`not exists (
          select 1 from ${borrowTransactions}
          where ${borrowTransactions.assetId} = ${assets.id}
            and ${borrowTransactions.status} = 'active'
        )`
      );
    }
    if (filters?.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(assets.assetCode, q),
          ilike(assets.name, q),
          ilike(assets.serialNumber, q),
          ilike(assets.location, q),
          ilike(assets.currentHolder, q)
        )!
      );
    }

    const base = db
      .select(assetListColumns)
      .from(assets)
      .orderBy(asc(assets.createdAt));
    const rows =
      conditions.length === 0 ? await base : await base.where(and(...conditions));
    return rows.map(withEmptyMaintenanceHistory);
  }

  async findById(id: string, session?: DbSession): Promise<AssetRow | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id))
      .limit(1);
    return row ?? null;
  }

  /** Row lock for custody mutations (release/return). */
  async findByIdForUpdate(
    id: string,
    session: DbSession
  ): Promise<AssetRow | null> {
    const [row] = await session
      .select()
      .from(assets)
      .where(eq(assets.id, id))
      .for("update")
      .limit(1);
    return row ?? null;
  }

  async findByAssetCode(
    assetCode: string,
    session?: DbSession
  ): Promise<AssetRow | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(assets)
      .where(eq(assets.assetCode, assetCode))
      .limit(1);
    return row ?? null;
  }

  async findByModelId(
    modelId: string,
    session?: DbSession
  ): Promise<AssetRow[]> {
    const db = this.db(session);
    const rows = await db
      .select(assetListColumns)
      .from(assets)
      .where(eq(assets.modelId, modelId))
      .orderBy(asc(assets.assetCode));
    return rows.map(withEmptyMaintenanceHistory);
  }

  async create(
    data: Omit<NewAssetRow, "id" | "createdAt" | "updatedAt" | "lastUpdated"> &
      Partial<Pick<NewAssetRow, "lastUpdated">>,
    session?: DbSession
  ): Promise<AssetRow> {
    const db = this.db(session);
    const [row] = await db.insert(assets).values(data).returning();

    if (!row) {
      throw new Error("Failed to create asset: no row returned from insert.");
    }

    return row;
  }

  async update(
    id: string,
    data: Partial<Omit<AssetRow, "id" | "createdAt">>,
    session?: DbSession
  ): Promise<AssetRow | null> {
    const db = this.db(session);
    const [row] = await db
      .update(assets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();

    return row ?? null;
  }

  async delete(id: string, session?: DbSession): Promise<boolean> {
    const db = this.db(session);
    const result = await db
      .delete(assets)
      .where(eq(assets.id, id))
      .returning({ id: assets.id });

    return result.length > 0;
  }
}
