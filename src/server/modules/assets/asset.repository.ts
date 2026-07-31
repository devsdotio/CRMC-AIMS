import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "@/server/db";
import { assets, type Asset, type NewAsset } from "@/server/db/schema";
import type {
  AssetSearchFilters,
  IAssetRepository,
  PaginatedResult,
} from "./asset.types";
import { DEFAULT_PAGE_SIZE } from "./asset.constants";

/**
 * Repository layer: talks to the database and nothing else.
 *
 * No validation, no error-throwing for business rules, no DTO mapping —
 * that all belongs in the service. This class only knows how to read and
 * write `assets` rows.
 */
export class AssetRepository implements IAssetRepository {
  async create(data: Omit<NewAsset, "id" | "createdAt" | "updatedAt">): Promise<Asset> {
    const [row] = await db.insert(assets).values(data).returning();
    if (!row) {
      throw new Error("Failed to create asset: no row returned from insert.");
    }
    return row;
  }

  async findById(id: string): Promise<Asset | null> {
    const [row] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByAssetCode(assetCode: string): Promise<Asset | null> {
    const [row] = await db
      .select()
      .from(assets)
      .where(eq(assets.assetCode, assetCode))
      .limit(1);
    return row ?? null;
  }

  async findAll(includeArchived = false): Promise<Asset[]> {
    const whereClause = includeArchived ? undefined : isNull(assets.archivedAt);

    return db
      .select()
      .from(assets)
      .where(whereClause)
      .orderBy(asc(assets.createdAt));
  }

  async update(id: string, data: Partial<Asset>): Promise<Asset | null> {
    const [row] = await db
      .update(assets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return row ?? null;
  }

  async archive(id: string): Promise<Asset | null> {
    const [row] = await db
      .update(assets)
      .set({ status: "ARCHIVED", archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(assets).where(eq(assets.id, id)).returning({
      id: assets.id,
    });
    return result.length > 0;
  }

  async search(filters: AssetSearchFilters): Promise<PaginatedResult<Asset>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const conditions = [
      filters.includeArchived ? undefined : isNull(assets.archivedAt),
      filters.assetType ? eq(assets.assetType, filters.assetType) : undefined,
      filters.categoryId ? eq(assets.categoryId, filters.categoryId) : undefined,
      filters.locationId ? eq(assets.locationId, filters.locationId) : undefined,
      filters.departmentId
        ? eq(assets.departmentId, filters.departmentId)
        : undefined,
      filters.status ? eq(assets.status, filters.status) : undefined,
      filters.condition ? eq(assets.condition, filters.condition) : undefined,
      filters.query
        ? or(
            ilike(assets.name, `%${filters.query}%`),
            ilike(assets.assetCode, `%${filters.query}%`),
            ilike(assets.brand, `%${filters.query}%`),
            ilike(assets.model, `%${filters.query}%`)
          )
        : undefined,
    ].filter(Boolean);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, countRows] = await Promise.all([
      db
        .select()
        .from(assets)
        .where(whereClause)
        .orderBy(asc(assets.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ value: count() }).from(assets).where(whereClause),
    ]);

    const total = countRows[0]?.value ?? 0;

    return { items, total: Number(total), page, pageSize };
  }
}
