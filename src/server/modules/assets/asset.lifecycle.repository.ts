import { and, desc, eq, isNotNull } from "drizzle-orm";

import { getDb } from "@/server/db";
import {
  assetLifecycleEvents,
  type AssetLifecycleEventRow,
  type NewAssetLifecycleEventRow,
} from "@/server/db/schema";

import type { ListLifecycleEventsFilters } from "./asset.lifecycle.types";

/**
 * Append-only lifecycle ledger access.
 * Intentionally no update/delete methods — audit integrity.
 */
export class AssetLifecycleRepository {
  async append(
    event: Omit<NewAssetLifecycleEventRow, "id" | "createdAt">
  ): Promise<AssetLifecycleEventRow> {
    const db = getDb();
    const [row] = await db.insert(assetLifecycleEvents).values(event).returning();

    if (!row) {
      throw new Error("Failed to append lifecycle event: no row returned.");
    }

    return row;
  }

  async findByAssetId(
    assetId: string,
    limit = 100
  ): Promise<AssetLifecycleEventRow[]> {
    const db = getDb();
    return db
      .select()
      .from(assetLifecycleEvents)
      .where(eq(assetLifecycleEvents.assetId, assetId))
      .orderBy(desc(assetLifecycleEvents.createdAt))
      .limit(limit);
  }

  async findMany(
    filters: ListLifecycleEventsFilters = {}
  ): Promise<AssetLifecycleEventRow[]> {
    const db = getDb();
    const limit = Math.min(filters.limit ?? 100, 500);
    const conditions = [];

    if (filters.assetId) {
      conditions.push(eq(assetLifecycleEvents.assetId, filters.assetId));
    }
    if (filters.assetCode) {
      conditions.push(eq(assetLifecycleEvents.assetCode, filters.assetCode));
    }
    if (filters.eventType) {
      conditions.push(eq(assetLifecycleEvents.eventType, filters.eventType));
    }

    // Exclude fully orphaned noise unless filtering by assetCode (post-delete audit)
    if (!filters.assetId && !filters.assetCode) {
      conditions.push(isNotNull(assetLifecycleEvents.assetId));
    }

    if (conditions.length === 0) {
      return db
        .select()
        .from(assetLifecycleEvents)
        .orderBy(desc(assetLifecycleEvents.createdAt))
        .limit(limit);
    }

    return db
      .select()
      .from(assetLifecycleEvents)
      .where(and(...conditions))
      .orderBy(desc(assetLifecycleEvents.createdAt))
      .limit(limit);
  }
}
