import { asc, eq } from "drizzle-orm";

import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import { assets, type AssetRow, type NewAssetRow } from "@/server/db/schema";

import type { IAssetRepository, ListAssetsFilters } from "./asset.types";

/**
 * Data-access only. No validation, no DTO mapping, no domain rules.
 * Methods accept optional `db` so multi-step ops can share a transaction.
 */
export class AssetRepository implements IAssetRepository {
  private db(session?: DbSession) {
    return session ?? getDb();
  }

  async findMany(
    filters?: ListAssetsFilters,
    session?: DbSession
  ): Promise<AssetRow[]> {
    const db = this.db(session);

    if (filters?.status) {
      return db
        .select()
        .from(assets)
        .where(eq(assets.status, filters.status))
        .orderBy(asc(assets.createdAt));
    }

    return db.select().from(assets).orderBy(asc(assets.createdAt));
  }

  async findById(id: string, session?: DbSession): Promise<AssetRow | null> {
    const db = this.db(session);
    const [row] = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
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
