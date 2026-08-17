import { desc, eq } from "drizzle-orm";

import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import {
  consumables,
  stockMovements,
  type NewStockMovementRow,
  type StockMovementRow,
} from "@/server/db/schema";

export type StockMovementListRow = StockMovementRow & {
  itemCode: string;
  itemName: string;
  unit: string;
};

export class StockMovementRepository {
  private db(session?: DbSession) {
    return session ?? getDb();
  }

  async create(
    data: Omit<NewStockMovementRow, "id" | "createdAt">,
    session?: DbSession
  ): Promise<StockMovementRow> {
    const db = this.db(session);
    const [row] = await db.insert(stockMovements).values(data).returning();
    if (!row) throw new Error("Failed to create stock movement.");
    return row;
  }

  async createMany(
    rows: Omit<NewStockMovementRow, "id" | "createdAt">[],
    session?: DbSession
  ): Promise<StockMovementRow[]> {
    if (rows.length === 0) return [];
    const db = this.db(session);
    return db.insert(stockMovements).values(rows).returning();
  }

  async listByConsumableId(
    consumableId: string,
    session?: DbSession
  ): Promise<StockMovementRow[]> {
    const db = this.db(session);
    return db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.consumableId, consumableId))
      .orderBy(desc(stockMovements.createdAt));
  }

  async listRecent(filters: {
    reason?: StockMovementRow["reason"];
    limit?: number;
  }): Promise<StockMovementListRow[]> {
    const db = this.db();
    const columns = {
      id: stockMovements.id,
      movementCode: stockMovements.movementCode,
      consumableId: stockMovements.consumableId,
      qty: stockMovements.qty,
      direction: stockMovements.direction,
      reason: stockMovements.reason,
      departmentId: stockMovements.departmentId,
      projectId: stockMovements.projectId,
      purchaseLotId: stockMovements.purchaseLotId,
      lotCode: stockMovements.lotCode,
      unitCost: stockMovements.unitCost,
      lineTotal: stockMovements.lineTotal,
      requestId: stockMovements.requestId,
      notes: stockMovements.notes,
      actorUserId: stockMovements.actorUserId,
      actorName: stockMovements.actorName,
      createdAt: stockMovements.createdAt,
      itemCode: consumables.itemCode,
      itemName: consumables.name,
      unit: consumables.unit,
    };

    const base = db
      .select(columns)
      .from(stockMovements)
      .innerJoin(consumables, eq(stockMovements.consumableId, consumables.id));

    const filtered = filters.reason
      ? base.where(eq(stockMovements.reason, filters.reason))
      : base;

    return filtered
      .orderBy(desc(stockMovements.createdAt))
      .limit(filters.limit ?? 100);
  }
}
