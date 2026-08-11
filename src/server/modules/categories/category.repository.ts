import { and, asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import { categories } from "@/server/db/schema";

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
}
