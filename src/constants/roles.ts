import type { UserRole, RoleDefinition } from "@/types/users";

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  superadmin: {
    title: "Superadmin",
    description: "Developer access — full system control and admin provisioning. Not for day-to-day campus ops.",
    badgeStyle: "filled",
  },
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
  borrower: {
    title: "Department account",
    description:
      "Shared login for one department — request borrowable, assignable, and consumable items on behalf of that office.",
    badgeStyle: "muted",
  },
};

export const INVITABLE_ROLES: UserRole[] = ["admin", "staff", "borrower"];
