import { desc, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import {
  projectExpenseLines,
  type NewProjectExpenseLineRow,
  type ProjectExpenseLineRow,
} from "@/server/db/schema";

import type {
  IProjectExpenseRepository,
} from "./project-expense.types";

export class ProjectExpenseRepository implements IProjectExpenseRepository {
  private db(session?: DbSession) {
    return session ?? getDb();
  }

  async findById(
    id: string,
    session?: DbSession
  ): Promise<ProjectExpenseLineRow | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(projectExpenseLines)
      .where(eq(projectExpenseLines.id, id))
      .limit(1);
    return row ?? null;
  }

  async listByProject(
    projectId: string,
    session?: DbSession
  ): Promise<ProjectExpenseLineRow[]> {
    const db = this.db(session);
    return db
      .select()
      .from(projectExpenseLines)
      .where(eq(projectExpenseLines.projectId, projectId))
      .orderBy(
        desc(projectExpenseLines.incurredOn),
        desc(projectExpenseLines.createdAt)
      );
  }

  async sumAmountsByProjectIds(
    projectIds: string[],
    session?: DbSession
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (projectIds.length === 0) return map;

    const db = this.db(session);
    const rows = await db
      .select({
        projectId: projectExpenseLines.projectId,
        total: sql<string>`coalesce(sum(${projectExpenseLines.amount}), 0)`,
      })
      .from(projectExpenseLines)
      .where(inArray(projectExpenseLines.projectId, projectIds))
      .groupBy(projectExpenseLines.projectId);

    for (const row of rows) {
      const n = Number(row.total);
      map.set(row.projectId, Number.isFinite(n) ? n.toFixed(2) : "0.00");
    }
    return map;
  }

  async create(
    data: Omit<NewProjectExpenseLineRow, "id" | "createdAt" | "updatedAt">,
    session?: DbSession
  ): Promise<ProjectExpenseLineRow> {
    const db = this.db(session);
    const [row] = await db.insert(projectExpenseLines).values(data).returning();
    if (!row) throw new Error("Failed to create project expense line.");
    return row;
  }

  async update(
    id: string,
    data: Partial<
      Omit<ProjectExpenseLineRow, "id" | "createdAt" | "projectId">
    >,
    session?: DbSession
  ): Promise<ProjectExpenseLineRow | null> {
    const db = this.db(session);
    const [row] = await db
      .update(projectExpenseLines)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projectExpenseLines.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string, session?: DbSession): Promise<boolean> {
    const db = this.db(session);
    const deleted = await db
      .delete(projectExpenseLines)
      .where(eq(projectExpenseLines.id, id))
      .returning({ id: projectExpenseLines.id });
    return deleted.length > 0;
  }
}
