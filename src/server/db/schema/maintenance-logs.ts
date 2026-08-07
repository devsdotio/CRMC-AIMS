import {
  boolean,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { assets, assetCategoryEnum } from "./assets";

export const maintenanceConditionEnum = pgEnum("maintenance_condition", [
  "good",
  "needs_maintenance",
  "damaged",
  "resolved",
]);

export const maintenanceSourceEnum = pgEnum("maintenance_source", [
  "return_checkout",
  "manual_flag",
]);

/**
 * First-class maintenance ledger (replaces jsonb-only history for new work).
 * Asset.maintenanceHistory remains for legacy compatibility / embedded UI.
 */
export const maintenanceLogs = pgTable(
  "maintenance_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    logCode: text("log_code").notNull().unique(),

    assetId: uuid("asset_id").references(() => assets.id, {
      onDelete: "set null",
    }),
    assetCode: text("asset_code").notNull(),
    assetName: text("asset_name").notNull(),
    category: assetCategoryEnum("category").notNull(),

    condition: maintenanceConditionEnum("condition").notNull(),
    source: maintenanceSourceEnum("source").notNull().default("manual_flag"),

    dateLogged: date("date_logged", { mode: "string" }).notNull(),
    loggedByUserId: uuid("logged_by_user_id").notNull(),
    loggedByName: text("logged_by_name").notNull(),
    notes: text("notes").notNull().default(""),

    isResolved: boolean("is_resolved").notNull().default(false),
    resolutionDate: date("resolution_date", { mode: "string" }),
    resolutionNotes: text("resolution_notes"),
    resolvedByUserId: uuid("resolved_by_user_id"),
    resolvedByName: text("resolved_by_name"),

    relatedBorrowLogCode: text("related_borrow_log_code"),
    scheduledDate: date("scheduled_date", { mode: "string" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("maintenance_logs_asset_id_idx").on(table.assetId),
    index("maintenance_logs_is_resolved_idx").on(table.isResolved),
    index("maintenance_logs_date_logged_idx").on(table.dateLogged),
    index("maintenance_logs_condition_idx").on(table.condition),
  ]
);

export type MaintenanceLogRow = typeof maintenanceLogs.$inferSelect;
export type NewMaintenanceLogRow = typeof maintenanceLogs.$inferInsert;
