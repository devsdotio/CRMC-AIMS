import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { assetAssignmentTypeEnum } from "./assets";

/**
 * Catalog entry for multi-unit capital equipment.
 *
 * Example: model "Epson 310 Printer" → 30 physical rows in `assets`,
 * each with its own `asset_code` / QR for individual custody tracking.
 *
 * Models do not themselves get QR tags — only units (assets) do.
 */
export const assetModels = pgTable(
  "asset_models",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Stable short code, e.g. PRT-EPSON-310 */
    modelCode: text("model_code").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    manufacturer: text("manufacturer"),

    defaultAssignmentType: assetAssignmentTypeEnum("default_assignment_type")
      .notNull()
      .default("borrowable"),
    defaultLocation: text("default_location"),
    defaultUnitValue: numeric("default_unit_value", {
      precision: 14,
      scale: 2,
    }),
    imageUrl: text("image_url"),
    notes: text("notes"),

    createdByUserId: uuid("created_by_user_id").notNull(),
    createdByName: text("created_by_name").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("asset_models_category_idx").on(table.category),
    index("asset_models_name_idx").on(table.name),
  ]
);

export type AssetModelRow = typeof assetModels.$inferSelect;
export type NewAssetModelRow = typeof assetModels.$inferInsert;
