import { and, desc, eq, ilike, or } from "drizzle-orm";

import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import {
  suppliers,
  type NewSupplierRow,
  type SupplierRow,
} from "@/server/db/schema";

import type { ISupplierRepository, ListSupplierFilters } from "./supplier.types";

export class SupplierRepository implements ISupplierRepository {
  private db(session?: DbSession) {
    return session ?? getDb();
  }

  async findById(id: string, session?: DbSession): Promise<SupplierRow | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);
    return row ?? null;
  }

  async list(
    filters: ListSupplierFilters = {},
    session?: DbSession
  ): Promise<SupplierRow[]> {
    const db = this.db(session);
    const conditions = [];

    if (filters.activeOnly) {
      conditions.push(eq(suppliers.status, "active"));
    } else if (filters.status) {
      conditions.push(eq(suppliers.status, filters.status));
    }

    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(suppliers.name, q),
          ilike(suppliers.supplierCode, q),
          ilike(suppliers.contactName, q),
          ilike(suppliers.contactEmail, q)
        )!
      );
    }

    const base = db.select().from(suppliers).orderBy(desc(suppliers.updatedAt));
    if (conditions.length === 0) return base;
    return base.where(and(...conditions));
  }

  async create(
    data: Omit<NewSupplierRow, "id" | "createdAt" | "updatedAt">,
    session?: DbSession
  ): Promise<SupplierRow> {
    const db = this.db(session);
    const [row] = await db.insert(suppliers).values(data).returning();
    if (!row) throw new Error("Failed to create supplier.");
    return row;
  }

  async update(
    id: string,
    data: Partial<Omit<SupplierRow, "id" | "createdAt" | "supplierCode">>,
    session?: DbSession
  ): Promise<SupplierRow | null> {
    const db = this.db(session);
    const [row] = await db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return row ?? null;
  }
}
