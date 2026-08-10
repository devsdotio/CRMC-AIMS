import {
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { projects } from "./projects";

/**
 * Project spend ledger. Phase 2 ships miscellaneous + adjustment lines.
 * Later: consumable / material / asset_writeoff row types reuse this table.
 *
 * Signed `amount`: positive = spend, negative = credit/refund (adjustments).
 */
export const projectExpenseLineTypeEnum = pgEnum("project_expense_line_type", [
  "miscellaneous",
  "adjustment",
  "consumable",
  "material",
  "asset_writeoff",
]);

export const projectExpenseCategoryEnum = pgEnum("project_expense_category", [
  "travel",
  "snacks",
  "labor",
  "broken_asset",
  "fees",
  "adjustment",
  "miscellaneous",
]);

export const projectExpenseLines = pgTable(
  "project_expense_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    lineType: projectExpenseLineTypeEnum("line_type")
      .notNull()
      .default("miscellaneous"),
    category: projectExpenseCategoryEnum("category")
      .notNull()
      .default("miscellaneous"),

    description: text("description").notNull(),
    /** PHP, 2 decimals — may be negative for credit/adjustment. */
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),

    quantity: numeric("quantity", { precision: 12, scale: 2 }),
    unitCost: numeric("unit_cost", { precision: 14, scale: 2 }),

    consumableId: uuid("consumable_id"),
    assetId: uuid("asset_id"),

    incurredOn: date("incurred_on", { mode: "string" }).notNull(),
    notes: text("notes"),

    recordedByUserId: uuid("recorded_by_user_id").notNull(),
    recordedByName: text("recorded_by_name").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("project_expense_lines_project_id_idx").on(table.projectId),
    index("project_expense_lines_incurred_on_idx").on(table.incurredOn),
    index("project_expense_lines_category_idx").on(table.category),
  ]
);

export type ProjectExpenseLineRow = typeof projectExpenseLines.$inferSelect;
export type NewProjectExpenseLineRow = typeof projectExpenseLines.$inferInsert;
