import { asc, eq } from "drizzle-orm";

import { getDb } from "@/server/db";
import { assets, type AssetRow, type NewAssetRow } from "@/server/db/schema";

import type { IAssetRepository, ListAssetsFilters } from "./asset.types";

/**
 * Data-access only. No validation, no DTO mapping, no domain rules.
 */
export class AssetRepository implements IAssetRepository {
  async findMany(filters?: ListAssetsFilters): Promise<AssetRow[]> {
    const db = getDb();

    if (filters?.status) {
      return db
        .select()
        .from(assets)
        .where(eq(assets.status, filters.status))
        .orderBy(asc(assets.createdAt));
    }

    return db.select().from(assets).orderBy(asc(assets.createdAt));
  }

  async findById(id: string): Promise<AssetRow | null> {
    const db = getDb();
    const [row] = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
    return row ?? null;
  }

  async findByAssetCode(assetCode: string): Promise<AssetRow | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(assets)
      .where(eq(assets.assetCode, assetCode))
      .limit(1);
    return row ?? null;
  }

  async create(
    data: Omit<NewAssetRow, "id" | "createdAt" | "updatedAt" | "lastUpdated"> &
      Partial<Pick<NewAssetRow, "lastUpdated">>
  ): Promise<AssetRow> {
    const db = getDb();
    const [row] = await db.insert(assets).values(data).returning();

    if (!row) {
      throw new Error("Failed to create asset: no row returned from insert.");
    }

    return row;
  }

  async update(
    id: string,
    data: Partial<Omit<AssetRow, "id" | "createdAt">>
  ): Promise<AssetRow | null> {
    const db = getDb();
    const [row] = await db
      .update(assets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();

    return row ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const db = getDb();
    const result = await db
      .delete(assets)
      .where(eq(assets.id, id))
      .returning({ id: assets.id });

    return result.length > 0;
  }
}
