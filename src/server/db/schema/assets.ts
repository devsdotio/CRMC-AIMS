import { sql } from "drizzle-orm";
import {
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  date,
  index,
} from "drizzle-orm/pg-core";

import type { MaintenanceLogEntry } from "@/types/assets";

/**
 * Enums mirror the frontend Asset contract
 * (`src/components/assets/types.ts`). Keep these in sync with
 * `src/server/modules/assets/asset.constants.ts`.
 */
export const assetCategoryEnum = pgEnum("asset_category", [
  "transport",
  "computing",
  "av",
  "furniture",
]);

export const assetAssignmentTypeEnum = pgEnum("asset_assignment_type", [
  "borrowable",
  "assignable",
]);

export const assetStatusEnum = pgEnum("asset_status", [
  "active",
  "needs_repair",
  "out_of_service",
  "retired",
]);

/**
 * Coded capital equipment registry — one row per physical asset
 * (the QR-tagged unit the custodian manages).
 *
 * Borrow lifecycle (who has it) is tracked via `currentHolder` for now.
 * A dedicated borrow_transactions table will own that later; release/
 * return mutations will then write there instead of mutating holder alone.
 *
 * Every accountable mutation also appends an immutable row to
 * `asset_lifecycle_events` (status changes, holder transitions, staff actor).
 *
 * Maintenance history is stored as jsonb matching MaintenanceLogEntry[]
 * until a first-class maintenance_logs table is introduced.
 *
 * Optional `supplierId` points at the vendors registry; multi-price history
 * is recorded on `purchase_lots` when acquisition cost is known.
 */
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    assetCode: text("asset_code").notNull().unique(),
    name: text("name").notNull(),
    category: assetCategoryEnum("category").notNull(),
    status: assetStatusEnum("status").notNull().default("active"),
    assignmentType: assetAssignmentTypeEnum("assignment_type").notNull().default("borrowable"),

    serialNumber: text("serial_number"),
    location: text("location").notNull(),
    currentHolder: text("current_holder"),
    department: text("department"),
    purchaseDate: date("purchase_date", { mode: "string" }),
    value: numeric("value", { precision: 14, scale: 2 }),
    supplierId: uuid("supplier_id"),
    imageUrl: text("image_url"),
    notes: text("notes"),

    lastUpdated: timestamp("last_updated", { withTimezone: true })
      .notNull()
      .defaultNow(),

    maintenanceHistory: jsonb("maintenance_history")
      .$type<MaintenanceLogEntry[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("assets_status_idx").on(table.status),
    index("assets_category_idx").on(table.category),
    index("assets_location_idx").on(table.location),
    index("assets_supplier_id_idx").on(table.supplierId),
  ]
);

export type AssetRow = typeof assets.$inferSelect;
export type NewAssetRow = typeof assets.$inferInsert;
