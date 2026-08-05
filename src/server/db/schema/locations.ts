import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),

  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
