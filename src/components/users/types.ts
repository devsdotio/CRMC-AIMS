/**
 * Shared TypeScript interfaces and predefined role definitions for Users & Roles feature.
 */

export type UserRole = "admin" | "staff" | "viewer";

export type UserStatus = "active" | "deactivated";

export interface RoleDefinition {
  title: string;
  description: string;
  badgeStyle: "filled" | "outlined" | "muted";
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  admin: {
    title: "Admin",
    description: "Full access — manage users/roles, all approve/reject actions, all data entry, system settings.",
    badgeStyle: "filled",
  },
  staff: {
    title: "Staff",
    description: "Day-to-day operations — approve/reject borrow requests, release/return assets, manage consumables, flag/resolve maintenance.",
    badgeStyle: "outlined",
  },
  viewer: {
    title: "Viewer",
    description: "Read-only — can view dashboard, assets, logs, reports, but cannot approve, edit, or create anything.",
    badgeStyle: "muted",
  },
};

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
