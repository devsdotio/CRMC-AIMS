import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { assets } from "@/features/assets/schema";

export async function listAssets() {
  const db = getDb();

  return db.select().from(assets).orderBy(asc(assets.createdAt));
}

export async function getAssetById(id: string) {
  const db = getDb();
  const [asset] = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
  return asset ?? null;
}

export async function getAssetByCode(code: string) {
  const db = getDb();
  const [asset] = await db.select().from(assets).where(eq(assets.code, code)).limit(1);
  return asset ?? null;
}
