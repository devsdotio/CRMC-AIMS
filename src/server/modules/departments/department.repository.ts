import { and, asc, eq, ilike, or, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import {
  departments,
  profiles,
  type Department,
} from "@/server/db/schema";

import type {
  DepartmentListRow,
  IDepartmentRepository,
  ListDepartmentFilters,
} from "./department.types";

export class DepartmentRepository implements IDepartmentRepository {
  private db(session?: DbSession) {
    return session ?? getDb();
  }

  async findById(id: string, session?: DbSession): Promise<Department | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByCode(
    code: string,
    session?: DbSession
  ): Promise<Department | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(departments)
      .where(sql`upper(${departments.code}) = upper(${code.trim()})`)
      .limit(1);
    return row ?? null;
  }

  async findByNameLower(
    name: string,
    session?: DbSession
  ): Promise<Department | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(departments)
      .where(sql`lower(${departments.name}) = lower(${name.trim()})`)
      .limit(1);
    return row ?? null;
  }

  async list(
    filters: ListDepartmentFilters = {},
    session?: DbSession
  ): Promise<DepartmentListRow[]> {
    const db = this.db(session);
    const conditions = [];

    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(ilike(departments.name, q), ilike(departments.code, q))!
      );
    }
    if (!filters.includeSandbox) {
      conditions.push(eq(departments.isSandbox, false));
    }

    const borrowerJoin = and(
      eq(profiles.departmentId, departments.id),
      eq(profiles.role, "borrower")
    );

    const query = db
      .select({
        id: departments.id,
        code: departments.code,
        name: departments.name,
        isSandbox: departments.isSandbox,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
        accountUserId: profiles.userId,
        accountEmail: profiles.email,
        accountStatus: profiles.status,
      })
      .from(departments)
      .leftJoin(profiles, borrowerJoin)
      .orderBy(asc(departments.name));

    if (conditions.length === 0) return query;
    return query.where(and(...conditions));
  }

  async create(
    data: Omit<Department, "id" | "createdAt" | "updatedAt">,
    session?: DbSession
  ): Promise<Department> {
    const db = this.db(session);
    const [row] = await db.insert(departments).values(data).returning();
    if (!row) throw new Error("Failed to create department.");
    return row;
  }

  async update(
    id: string,
    data: Partial<Pick<Department, "code" | "name" | "isSandbox">>,
    session?: DbSession
  ): Promise<Department | null> {
    const db = this.db(session);
    const [row] = await db
      .update(departments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: string, session?: DbSession): Promise<boolean> {
    const db = this.db(session);
    const deleted = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning({ id: departments.id });
    return deleted.length > 0;
  }

  async countLinkedProfiles(
    id: string,
    session?: DbSession
  ): Promise<number> {
    const db = this.db(session);
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(eq(profiles.departmentId, id));
    return row?.count ?? 0;
  }

  async syncLinkedProfileDepartmentName(
    departmentId: string,
    name: string,
    session?: DbSession
  ): Promise<void> {
    const db = this.db(session);
    await db
      .update(profiles)
      .set({ department: name, updatedAt: new Date() })
      .where(eq(profiles.departmentId, departmentId));
  }
}
