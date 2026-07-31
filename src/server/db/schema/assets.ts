import {
  pgTable,
  pgEnum,
  uuid,
  text,
  numeric,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { departments } from "./departments";
import { locations } from "./locations";

/**
 * ---------------------------------------------------------------------------
 * Enums
 * ---------------------------------------------------------------------------
 * These map 1:1 to the constants exported from
 * `src/server/modules/assets/asset.constants.ts`. Keep both in sync.
 */

export const assetTypeEnum = pgEnum("asset_type", [
  "CONSUMABLE",
  "ASSIGNABLE",
  "BORROWABLE",
]);

export const assetStatusEnum = pgEnum("asset_status", [
  "AVAILABLE",
  "ASSIGNED",
  "BORROWED",
  "ARCHIVED",
]);

export const assetConditionEnum = pgEnum("asset_condition", [
  "NEW",
  "GOOD",
  "FAIR",
  "DAMAGED",
  "FOR_REPAIR",
  "DISPOSED",
]);

/**
 * ---------------------------------------------------------------------------
 * Assets table
 * ---------------------------------------------------------------------------
 * This represents the CATALOG of assets (the "what"), not individual
 * physical units (the "which one"). Serialized/unit-level tracking,
 * borrowing, assignment, and movement history are deliberately out of
 * scope here and will live in future tables:
 *
 *   - asset_units          (individual serialized/trackable units)
 *   - inventory_movements  (stock in/out history for consumables)
 *   - borrow_transactions  (borrow/return lifecycle)
 *   - assignments          (long-term assignment to a person/department)
 *
 * Those tables will reference `assets.id` as a foreign key once built.
 */
export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),

  assetCode: text("asset_code").notNull().unique(),

  name: text("name").notNull(),
  description: text("description"),

  assetType: assetTypeEnum("asset_type").notNull(),

  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),

  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "restrict" }),

  departmentId: uuid("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),

  brand: text("brand"),
  model: text("model"),
  manufacturer: text("manufacturer"),

  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
  purchaseDate: date("purchase_date", { mode: "date" }),

  status: assetStatusEnum("status").notNull().default("AVAILABLE"),
  condition: assetConditionEnum("condition").notNull().default("NEW"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
