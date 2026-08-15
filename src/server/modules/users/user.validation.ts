import { z } from "zod";

import { APP_ROLES, PROFILE_STATUSES } from "@/server/shared/roles";

export const appRoleSchema = z.enum(APP_ROLES);
export const profileStatusSchema = z.enum(PROFILE_STATUSES);

/** Roles creatable via API (superadmin excluded — seed only). */
export const provisionableRoleSchema = z.enum(["admin", "staff", "borrower"]);

const passwordSchema = z
  .string()
  .min(8, "password must be at least 8 characters.")
  .max(128, "password is too long.");

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "name is required.").max(255),
  email: z.string().trim().email("Valid email is required.").max(320),
  role: provisionableRoleSchema,
  department: z.string().trim().max(120).optional(),
  /** Admin-set initial password. Required — no invite/email signup flow. */
  password: passwordSchema,
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    role: provisionableRoleSchema.optional(),
    department: z.string().trim().max(120).nullable().optional(),
    status: profileStatusSchema.optional(),
    /** Optional replacement password set by an admin. */
    password: passwordSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update.",
  });

/** Self-service profile fields only — never role, status, or password. */
export const updateMeSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    department: z.string().trim().max(120).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password.",
    path: ["newPassword"],
  });

export const listUsersQuerySchema = z.object({
  role: appRoleSchema.optional(),
  status: profileStatusSchema.optional(),
  search: z.string().trim().max(200).optional(),
});

export const userIdSchema = z.string().uuid("User id must be a valid UUID.");

export type CreateUserBody = z.infer<typeof createUserSchema>;
export type UpdateUserBody = z.infer<typeof updateUserSchema>;
export type UpdateMeBody = z.infer<typeof updateMeSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
