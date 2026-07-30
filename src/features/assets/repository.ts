import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { assets } from "@/features/assets/schema";
import type { Asset, AssetStatus, NewAsset } from "@/features/assets/types";

type UpdateAssetRepoInput = Partial<
  Pick<Asset, "code" | "name" | "category" | "condition" | "status">
>;

export class AssetRepository {
  async findMany(filters?: { status?: AssetStatus }): Promise<Asset[]> {
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

  async findById(id: string): Promise<Asset | null> {
    const db = getDb();
    const [asset] = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
    return asset ?? null;
  }

  async findByCode(code: string): Promise<Asset | null> {
    const db = getDb();
    const [asset] = await db.select().from(assets).where(eq(assets.code, code)).limit(1);
    return asset ?? null;
  }

  async create(input: NewAsset): Promise<Asset> {
    const db = getDb();
    const [createdAsset] = await db.insert(assets).values(input).returning();
    return createdAsset;
  }

  async updateById(id: string, input: UpdateAssetRepoInput): Promise<Asset | null> {
    const db = getDb();
    const [updatedAsset] = await db
      .update(assets)
      .set(input)
      .where(eq(assets.id, id))
      .returning();

    return updatedAsset ?? null;
  }

  async deleteById(id: string): Promise<boolean> {
    const db = getDb();

    const [deletedAsset] = await db
      .delete(assets)
      .where(eq(assets.id, id))
      .returning({ id: assets.id });

    return Boolean(deletedAsset);
  }
}
