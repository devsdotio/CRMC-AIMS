import type { UserRole, RoleDefinition } from "@/types/users";

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
  borrower: {
    title: "Borrower / Requester",
    description: "Request access — submit borrow requests for equipment, request consumable stock, and track personal request status.",
    badgeStyle: "muted",
  },
};
