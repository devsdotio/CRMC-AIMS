import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),

  code: text("code").notNull().unique(),
  name: text("name").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
