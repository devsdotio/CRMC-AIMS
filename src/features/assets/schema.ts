import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const assetStatusEnum = pgEnum("asset_status", [
	"available",
	"borrowed",
	"under_repair",
]);

export const assets = pgTable("assets", {
	id: uuid("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	code: text("code").notNull().unique(),
	name: text("name").notNull(),
	category: text("category").notNull(),
	condition: text("condition").notNull(),
	status: assetStatusEnum("status").notNull().default("available"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});
