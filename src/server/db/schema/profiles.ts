import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Application profiles linked 1:1 to Supabase Auth users.
 *
 * Roles:
 * - superadmin — developers (seeded; not grantable via normal admin UI)
 * - admin — creates staff/borrower accounts, manages users
 * - staff — property custodian operations
 * - borrower — request / borrow only (restricted shell)
 *
 * There is no public self-signup. Accounts are provisioned via the service-role
 * admin API (+ a row in this table).
 */
export const appRoleEnum = pgEnum("app_role", [
  "superadmin",
  "admin",
  "staff",
  "borrower",
]);

export const profileStatusEnum = pgEnum("profile_status", [
  "active",
  "deactivated",
]);

export const profiles = pgTable(
  "profiles",
  {
    /** Same UUID as auth.users.id */
    userId: uuid("user_id").primaryKey(),

    email: text("email").notNull().unique(),
    fullName: text("full_name").notNull(),
    role: appRoleEnum("role").notNull().default("staff"),
    status: profileStatusEnum("status").notNull().default("active"),
    department: text("department"),

    /** Staff who provisioned this account (null for seed/superadmin bootstrap). */
    createdByUserId: uuid("created_by_user_id"),

    /**
     * Last time this user hit an authenticated app route / API.
     * Null until first successful session after account creation.
     */
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("profiles_role_idx").on(table.role),
    index("profiles_status_idx").on(table.status),
    index("profiles_email_idx").on(table.email),
    index("profiles_last_active_at_idx").on(table.lastActiveAt),
  ]
);

export type ProfileRow = typeof profiles.$inferSelect;
export type NewProfileRow = typeof profiles.$inferInsert;
