import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { assets } from "./assets";

/**
 * Staff-facing borrow request queue (approve / reject).
 * Actual custody transfer lives on borrow_transactions + assets.current_holder.
 */
export const borrowRequestStatusEnum = pgEnum("borrow_request_status", [
  "pending",
  "approved",
  "rejected",
  "released",
  "unreleased",
  "returned",
  "cancelled",
]);

export type BorrowRequestHistoryEntry = {
  id: string;
  action:
    | "submitted"
    | "approved"
    | "rejected"
    | "released"
    | "unreleased"
    | "returned"
    | "cancelled";
  actor: string;
  timestamp: string;
  note?: string;
};

export const borrowRequests = pgTable(
  "borrow_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    requestCode: text("request_code").notNull().unique(),

    /** Linked borrower profile when known (auth user id). */
    requesterUserId: uuid("requester_user_id"),

    requesterName: text("requester_name").notNull(),
    requesterEmail: text("requester_email").notNull(),
    requesterPhone: text("requester_phone").notNull().default(""),
    department: text("department").notNull(),

    items: jsonb("items")
      .$type<{
        itemDescription: string;
        assetId?: string;
        assetCode?: string;
        category: string;
        quantity: number;
        itemType: "asset" | "consumable";
      }[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    purpose: text("purpose").notNull(),

    expectedReturnDate: date("expected_return_date", { mode: "string" }).notNull(),
    status: borrowRequestStatusEnum("status").notNull().default("pending"),

    notes: text("notes"),
    rejectionReason: text("rejection_reason"),
    pickedUpBy: text("picked_up_by"),

    history: jsonb("history")
      .$type<BorrowRequestHistoryEntry[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),

    requestedAt: timestamp("requested_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("borrow_requests_status_idx").on(table.status),
    index("borrow_requests_department_idx").on(table.department),
    index("borrow_requests_requested_at_idx").on(table.requestedAt),
  ]
);

export type BorrowRequestRow = typeof borrowRequests.$inferSelect;
export type NewBorrowRequestRow = typeof borrowRequests.$inferInsert;
