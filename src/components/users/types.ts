/**
 * Shared TypeScript interfaces and predefined role definitions for Users & Roles feature.
 */

export type UserRole = "superadmin" | "admin" | "staff" | "borrower";

export type UserStatus = "active" | "deactivated";

export interface RoleDefinition {
  title: string;
  description: string;
  badgeStyle: "filled" | "outlined" | "muted";
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  superadmin: {
    title: "Superadmin",
    description:
      "Developer access — full system control and admin provisioning. Not for day-to-day campus ops.",
    badgeStyle: "filled",
  },
  admin: {
    title: "Admin",
    description:
      "Full operational control — manage staff and borrower accounts, all approve/reject actions, registry, settings.",
    badgeStyle: "filled",
  },
  staff: {
    title: "Staff",
    description:
      "Day-to-day operations — approve/reject borrow requests, release/return assets, manage consumables, flag/resolve maintenance.",
    badgeStyle: "outlined",
  },
  borrower: {
    title: "Borrower / Requester",
    description:
      "Request access — submit borrow requests for equipment, request consumable stock, and track personal request status.",
    badgeStyle: "muted",
  },
};

/** Roles that can be assigned when inviting users (superadmin is seed-only). */
export const INVITABLE_ROLES: UserRole[] = ["admin", "staff", "borrower"];

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  department: string;
  dateAdded: string; // YYYY-MM-DD
  lastActive: string; // Relative string or date
  activitySummary?: string; // e.g. "Approved 3 requests this week"
}

export interface UserFilterState {
  searchQuery: string;
  role: string;
  status: string;
}
