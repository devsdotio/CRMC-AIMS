import { desc, eq } from "drizzle-orm";

import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import {
  stockMovements,
  type NewStockMovementRow,
  type StockMovementRow,
} from "@/server/db/schema";

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
}
