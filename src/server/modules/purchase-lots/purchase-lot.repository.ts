import { and, asc, desc, eq, gt, ilike, or } from "drizzle-orm";

import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import {
  purchaseLots,
  type NewPurchaseLotRow,
  type PurchaseLotRow,
} from "@/server/db/schema";

import type {
  IPurchaseLotRepository,
  ListPurchaseLotFilters,
} from "./purchase-lot.types";

export class PurchaseLotRepository implements IPurchaseLotRepository {
  private db(session?: DbSession) {
    return session ?? getDb();
  }

  async findById(
    id: string,
    session?: DbSession
  ): Promise<PurchaseLotRow | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(purchaseLots)
      .where(eq(purchaseLots.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByLotCode(
    lotCode: string,
    session?: DbSession
  ): Promise<PurchaseLotRow | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(purchaseLots)
      .where(eq(purchaseLots.lotCode, lotCode))
      .limit(1);
    return row ?? null;
  }

  async findByLotCodeForUpdate(
    lotCode: string,
    session: DbSession
  ): Promise<PurchaseLotRow | null> {
    const [row] = await session
      .select()
      .from(purchaseLots)
      .where(eq(purchaseLots.lotCode, lotCode))
      .for("update")
      .limit(1);
    return row ?? null;
  }

  async list(
    filters: ListPurchaseLotFilters = {},
    session?: DbSession
  ): Promise<PurchaseLotRow[]> {
    const db = this.db(session);
    const conditions = [];

    if (filters.consumableId) {
      conditions.push(eq(purchaseLots.consumableId, filters.consumableId));
    }
    if (filters.assetId) {
      conditions.push(eq(purchaseLots.assetId, filters.assetId));
    }
    if (filters.supplierId) {
      conditions.push(eq(purchaseLots.supplierId, filters.supplierId));
    }
    if (filters.itemType) {
      conditions.push(eq(purchaseLots.itemType, filters.itemType));
    }
    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(purchaseLots.lotCode, q),
          ilike(purchaseLots.itemCode, q),
          ilike(purchaseLots.itemName, q),
          ilike(purchaseLots.supplierName, q),
          ilike(purchaseLots.reference, q)
        )!
      );
    }

    const base = db
      .select()
      .from(purchaseLots)
      .orderBy(desc(purchaseLots.purchasedOn), desc(purchaseLots.createdAt));

    if (conditions.length === 0) return base;
    return base.where(and(...conditions));
  }

  /**
   * Oldest-first lots with remaining qty (FIFO), row locks for concurrent draws.
   */
  async listAvailableForConsumableFifo(
    consumableId: string,
    session: DbSession
  ): Promise<PurchaseLotRow[]> {
    return session
      .select()
      .from(purchaseLots)
      .where(
        and(
          eq(purchaseLots.consumableId, consumableId),
          eq(purchaseLots.itemType, "consumable"),
          gt(purchaseLots.quantityRemaining, 0)
        )
      )
      .orderBy(asc(purchaseLots.purchasedOn), asc(purchaseLots.createdAt))
      .for("update");
  }

  async updateRemaining(
    id: string,
    quantityRemaining: number,
    session?: DbSession
  ): Promise<PurchaseLotRow | null> {
    const db = this.db(session);
    const [row] = await db
      .update(purchaseLots)
      .set({ quantityRemaining, updatedAt: new Date() })
      .where(eq(purchaseLots.id, id))
      .returning();
    return row ?? null;
  }

  async create(
    data: Omit<NewPurchaseLotRow, "id" | "createdAt" | "updatedAt">,
    session?: DbSession
  ): Promise<PurchaseLotRow> {
    const db = this.db(session);
    const [row] = await db.insert(purchaseLots).values(data).returning();
    if (!row) throw new Error("Failed to create purchase lot.");
    return row;
  }
}
