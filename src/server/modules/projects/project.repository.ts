import { and, desc, eq, ilike, or } from "drizzle-orm";

import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import {
  projects,
  type NewProjectRow,
  type ProjectRow,
} from "@/server/db/schema";

import type { IProjectRepository, ListProjectFilters } from "./project.types";

export class ProjectRepository implements IProjectRepository {
  private db(session?: DbSession) {
    return session ?? getDb();
  }

  async findById(id: string, session?: DbSession): Promise<ProjectRow | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    return row ?? null;
  }

  async list(
    filters: ListProjectFilters = {},
    session?: DbSession
  ): Promise<ProjectRow[]> {
    const db = this.db(session);
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(projects.status, filters.status));
    }

    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(projects.name, q),
          ilike(projects.projectCode, q),
          ilike(projects.location, q),
          ilike(projects.department, q),
          ilike(projects.description, q)
        )!
      );
    }

    const base = db.select().from(projects).orderBy(desc(projects.updatedAt));

    if (conditions.length === 0) return base;
    return base.where(and(...conditions));
  }

  async create(
    data: Omit<NewProjectRow, "id" | "createdAt" | "updatedAt">,
    session?: DbSession
  ): Promise<ProjectRow> {
    const db = this.db(session);
    const [row] = await db.insert(projects).values(data).returning();
    if (!row) throw new Error("Failed to create project.");
    return row;
  }

  async update(
    id: string,
    data: Partial<Omit<ProjectRow, "id" | "createdAt" | "projectCode">>,
    session?: DbSession
  ): Promise<ProjectRow | null> {
    const db = this.db(session);
    const [row] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string, session?: DbSession): Promise<boolean> {
    const db = this.db(session);
    const deleted = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    return deleted.length > 0;
  }
}
