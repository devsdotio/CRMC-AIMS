import { and, asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import { withTransaction, type DbSession } from "@/server/db/transaction";
import {
  categories,
  assets,
  assetModels,
  maintenanceLogs,
  borrowTransactions,
  consumables,
} from "@/server/db/schema";

export type CategoryType = "asset" | "consumable";

export class CategoryRepository {
  private db(session?: DbSession) {
    return session ?? getDb();
  }

  async listByType(type?: CategoryType, session?: DbSession) {
    const db = this.db(session);
    if (type) {
      return db
        .select()
        .from(categories)
        .where(eq(categories.type, type))
        .orderBy(asc(categories.name));
    }
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async listWithCounts(type?: CategoryType, session?: DbSession) {
    const db = this.db(session);
    const rows = await this.listByType(type, session);

    const assetCounts = await db
      .select({
        categoryLower: sql<string>`lower(${assets.category})`,
        count: sql<number>`count(*)::int`,
      })
      .from(assets)
      .groupBy(sql`lower(${assets.category})`);

    const consumableCounts = await db
      .select({
        categoryLower: sql<string>`lower(${consumables.category})`,
        count: sql<number>`count(*)::int`,
      })
      .from(consumables)
      .groupBy(sql`lower(${consumables.category})`);

    const assetCountMap = new Map(assetCounts.map((r) => [r.categoryLower, r.count]));
    const consumableCountMap = new Map(
      consumableCounts.map((r) => [r.categoryLower, r.count])
    );

    return rows.map((c) => {
      const lowerName = c.name.trim().toLowerCase();
      const itemCount =
        c.type === "asset"
          ? (assetCountMap.get(lowerName) ?? 0)
          : (consumableCountMap.get(lowerName) ?? 0);

      return {
        id: c.id,
        name: c.name,
        type: c.type as CategoryType,
        colorToken: c.colorToken || undefined,
        itemCount,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });
  }

  async findById(id: string, session?: DbSession) {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return row ?? null;
  }

  /** Case-insensitive match of settings-defined category name. */
  async findByTypeAndName(
    type: CategoryType,
    name: string,
    session?: DbSession
  ) {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.type, type),
          sql`lower(${categories.name}) = lower(${name.trim()})`
        )
      )
      .limit(1);
    return row ?? null;
  }

  async countUsages(
    name: string,
    type: CategoryType,
    session?: DbSession
  ): Promise<number> {
    const db = this.db(session);
    const lower = name.trim().toLowerCase();

    if (type === "asset") {
      const [res] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(assets)
        .where(sql`lower(${assets.category}) = ${lower}`);
      return res?.count ?? 0;
    } else {
      const [res] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(consumables)
        .where(sql`lower(${consumables.category}) = ${lower}`);
      return res?.count ?? 0;
    }
  }

  async updateAndCascade(
    id: string,
    payload: {
      name: string;
      type: CategoryType;
      colorToken?: string | null;
    },
    session?: DbSession
  ) {
    const run = async (tx: DbSession) => {
      const [existing] = await tx
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);

      if (!existing) {
        return null;
      }

      const oldName = existing.name.trim();
      const newName = payload.name.trim();
      const now = new Date();

      const [updated] = await tx
        .update(categories)
        .set({
          name: newName,
          type: payload.type,
          ...(payload.colorToken !== undefined
            ? { colorToken: payload.colorToken || null }
            : {}),
          updatedAt: now,
        })
        .where(eq(categories.id, id))
        .returning();

      // If category name changed, cascade update to all entities referencing this category name
      if (oldName.toLowerCase() !== newName.toLowerCase()) {
        const oldLower = oldName.toLowerCase();

        if (existing.type === "asset" || payload.type === "asset") {
          await tx
            .update(assets)
            .set({ category: newName, lastUpdated: now })
            .where(sql`lower(${assets.category}) = ${oldLower}`);

          await tx
            .update(assetModels)
            .set({ category: newName, updatedAt: now })
            .where(sql`lower(${assetModels.category}) = ${oldLower}`);

          await tx
            .update(maintenanceLogs)
            .set({ category: newName, updatedAt: now })
            .where(sql`lower(${maintenanceLogs.category}) = ${oldLower}`);

          await tx
            .update(borrowTransactions)
            .set({ category: newName, updatedAt: now })
            .where(sql`lower(${borrowTransactions.category}) = ${oldLower}`);
        }

        if (existing.type === "consumable" || payload.type === "consumable") {
          await tx
            .update(consumables)
            .set({ category: newName, updatedAt: now })
            .where(sql`lower(${consumables.category}) = ${oldLower}`);
        }
      }

      // Compute item count after update
      const lower = newName.toLowerCase();
      let count = 0;
      if (updated.type === "asset") {
        const [assetRes] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(assets)
          .where(sql`lower(${assets.category}) = ${lower}`);
        count = assetRes?.count ?? 0;
      } else {
        const [consumableRes] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(consumables)
          .where(sql`lower(${consumables.category}) = ${lower}`);
        count = consumableRes?.count ?? 0;
      }

      return {
        id: updated.id,
        name: updated.name,
        type: updated.type as CategoryType,
        colorToken: updated.colorToken || undefined,
        itemCount: count,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    };

    if (session) {
      return run(session);
    }
    return withTransaction(run);
  }
}
