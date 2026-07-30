import { asc, eq, inArray } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { getDb } from "@/db";
import { assets } from "@/features/assets/schema";
import type { CreateAssetInput } from "@/features/assets/types";

export type AssetRecord = InferSelectModel<typeof assets>;
type NewAssetRecord = InferInsertModel<typeof assets>;

type AssetRecordStatus = AssetRecord["status"];

type AssetRecordFilters = {
  statuses?: AssetRecordStatus[];
};

type UpdateAssetRepoInput = Partial<
  Pick<AssetRecord, "code" | "name" | "category" | "condition" | "status">
>;

export class AssetRepository {
  async findMany(filters?: AssetRecordFilters): Promise<AssetRecord[]> {
    const db = getDb();

    if (!filters?.statuses || filters.statuses.length === 0) {
      return db.select().from(assets).orderBy(asc(assets.createdAt));
    }

    if (filters.statuses.length === 1) {
      return db
        .select()
        .from(assets)
        .where(eq(assets.status, filters.statuses[0]))
        .orderBy(asc(assets.createdAt));
    }

    return db
      .select()
      .from(assets)
      .where(inArray(assets.status, filters.statuses))
      .orderBy(asc(assets.createdAt));
  }

  async findById(id: string): Promise<AssetRecord | null> {
    const db = getDb();
    const [asset] = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
    return asset ?? null;
  }

  async findByCode(code: string): Promise<AssetRecord | null> {
    const db = getDb();
    const [asset] = await db.select().from(assets).where(eq(assets.code, code)).limit(1);
    return asset ?? null;
  }

  async create(input: NewAssetRecord): Promise<AssetRecord> {
    const db = getDb();
    const [createdAsset] = await db.insert(assets).values(input).returning();
    return createdAsset;
  }

  async updateById(id: string, input: UpdateAssetRepoInput): Promise<AssetRecord | null> {
    const db = getDb();
    const [updatedAsset] = await db
      .update(assets)
      .set(input)
      .where(eq(assets.id, id))
      .returning();

    return updatedAsset ?? null;
  }

  async updateMetadataById(id: string, input: Partial<CreateAssetInput>): Promise<void> {
    if (Object.keys(input).length === 0) {
      return;
    }

    const db = getDb();

    const [existingAsset] = await db
      .select({ condition: assets.condition })
      .from(assets)
      .where(eq(assets.id, id))
      .limit(1);

    if (!existingAsset) {
      return;
    }

    const metadata = parseAssetMetadata(existingAsset.condition);
    const nextMetadata = {
      ...metadata,
      ...input,
    };

    await db
      .update(assets)
      .set({ condition: serializeAssetMetadata(nextMetadata) })
      .where(eq(assets.id, id));
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

type AssetMetadata = Partial<CreateAssetInput>;

export function parseAssetMetadata(rawCondition: string): AssetMetadata {
  if (!rawCondition.startsWith("meta:")) {
    return { notes: rawCondition };
  }

  const rawJson = rawCondition.slice(5);

  try {
    const parsed = JSON.parse(rawJson) as AssetMetadata;
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

export function serializeAssetMetadata(metadata: AssetMetadata): string {
  return `meta:${JSON.stringify(metadata)}`;
}
