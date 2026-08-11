import { sql } from "drizzle-orm";
import {
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { assets } from "./assets";
import { borrowRequests } from "./borrow-requests";

/**
 * Borrow & return custody ledger (the operational "log").
 * Stored status is active | returned; "overdue" is derived in DTOs when due.
 */
export const borrowTransactionStatusEnum = pgEnum("borrow_transaction_status", [
  "active",
  "returned",
]);

export const returnConditionEnum = pgEnum("return_condition", [
  "good",
  "damaged",
  "needs_repair",
]);

export const borrowTransactions = pgTable(
  "borrow_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    logCode: text("log_code").notNull().unique(),

    requestId: uuid("request_id").references(() => borrowRequests.id, {
      onDelete: "set null",
    }),
    requestCode: text("request_code"),

    assetId: uuid("asset_id").references(() => assets.id, {
      onDelete: "set null",
    }),
    assetCode: text("asset_code").notNull(),
    assetName: text("asset_name").notNull(),
    category: text("category").notNull(),

    borrowerUserId: uuid("borrower_user_id"),
    borrowerName: text("borrower_name").notNull(),
    borrowerEmail: text("borrower_email").notNull().default(""),
    borrowerPhone: text("borrower_phone").notNull().default(""),
    department: text("department").notNull(),

    releasedAt: timestamp("released_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    returnedAt: timestamp("returned_at", { withTimezone: true }),

    status: borrowTransactionStatusEnum("status").notNull().default("active"),

    conditionOnReturn: returnConditionEnum("condition_on_return"),
    conditionNotes: text("condition_notes"),

    releasedByUserId: uuid("released_by_user_id").notNull(),
    releasedByName: text("released_by_name").notNull(),
    receivedByUserId: uuid("received_by_user_id"),
    receivedByName: text("received_by_name"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("borrow_transactions_status_idx").on(table.status),
    index("borrow_transactions_due_date_idx").on(table.dueDate),
    index("borrow_transactions_asset_id_idx").on(table.assetId),
    index("borrow_transactions_released_at_idx").on(table.releasedAt),
    index("borrow_transactions_department_idx").on(table.department),
  ]
);

export type BorrowTransactionRow = typeof borrowTransactions.$inferSelect;
export type NewBorrowTransactionRow = typeof borrowTransactions.$inferInsert;
