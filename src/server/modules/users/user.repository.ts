import { and, asc, eq, ilike, or } from "drizzle-orm";

import { getDb } from "@/server/db";
import {
  profiles,
  type NewProfileRow,
  type ProfileRow,
} from "@/server/db/schema";

import type { IProfileRepository, ListUsersFilters } from "./user.types";

export class ProfileRepository implements IProfileRepository {
  async findByUserId(userId: string): Promise<ProfileRow | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    return row ?? null;
  }

  async findByEmail(email: string): Promise<ProfileRow | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email.toLowerCase()))
      .limit(1);
    return row ?? null;
  }

  async list(filters: ListUsersFilters = {}): Promise<ProfileRow[]> {
    const db = getDb();
    const conditions = [];

    if (filters.role) {
      conditions.push(eq(profiles.role, filters.role));
    }
    if (filters.status) {
      conditions.push(eq(profiles.status, filters.status));
    }
    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(ilike(profiles.fullName, q), ilike(profiles.email, q))!
      );
    }

    if (conditions.length === 0) {
      return db.select().from(profiles).orderBy(asc(profiles.fullName));
    }

    return db
      .select()
      .from(profiles)
      .where(and(...conditions))
      .orderBy(asc(profiles.fullName));
  }

  async create(data: NewProfileRow): Promise<ProfileRow> {
    const db = getDb();
    const [row] = await db.insert(profiles).values(data).returning();
    if (!row) {
      throw new Error("Failed to create profile: no row returned.");
    }
    return row;
  }

  async update(
    userId: string,
    data: Partial<Omit<ProfileRow, "userId" | "createdAt">>
  ): Promise<ProfileRow | null> {
    const db = getDb();
    const [row] = await db
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return row ?? null;
  }
}
