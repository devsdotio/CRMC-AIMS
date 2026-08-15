import type { ProfileRow } from "@/server/db/schema";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/server/shared/errors";
import type { ActorContext } from "@/server/shared/auth";
import {
  assignableRolesFor,
  type AppRole,
} from "@/server/shared/roles";

import { ProfileRepository } from "./user.repository";
import type {
  CreateUserInput,
  IProfileRepository,
  ListUsersFilters,
  ProfileDTO,
  UpdateUserInput,
} from "./user.types";
import {
  changePasswordSchema,
  createUserSchema,
  listUsersQuerySchema,
  updateMeSchema,
  updateUserSchema,
  userIdSchema,
} from "./user.validation";

function toDateString(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function toProfileDTO(row: ProfileRow): ProfileDTO {
  const lastActiveAt = row.lastActiveAt ?? null;

  return {
    id: row.userId,
    email: row.email,
    name: row.fullName,
    role: row.role,
    status: row.status,
    department: row.department,
    dateAdded: toDateString(row.createdAt),
    lastActive:
      row.status === "deactivated"
        ? lastActiveAt
          ? `Deactivated · last seen ${formatRelativeTime(lastActiveAt)}`
          : "Deactivated"
        : formatRelativeTime(lastActiveAt),
    lastActiveAt: lastActiveAt
      ? lastActiveAt instanceof Date
        ? lastActiveAt.toISOString()
        : String(lastActiveAt)
      : null,
    createdByUserId: row.createdByUserId,
  };
}

function assertCanAssignRole(actor: ActorContext, targetRole: AppRole) {
  const allowed = assignableRolesFor(actor.role);
  if (!allowed.includes(targetRole)) {
    throw new ForbiddenError(
      `Your role (${actor.role}) cannot assign the "${targetRole}" role.`
    );
  }
}

function assertCanMutateTarget(actor: ActorContext, target: ProfileRow) {
  if (target.userId === actor.userId) {
    throw new ForbiddenError("You cannot modify your own account here.");
  }

  if (target.role === "superadmin" && actor.role !== "superadmin") {
    throw new ForbiddenError("Only superadmins can manage superadmin accounts.");
  }

  if (target.role === "admin" && actor.role === "admin") {
    throw new ForbiddenError("Admins cannot modify other admin accounts.");
  }

  if (actor.role === "admin" && !["staff", "borrower"].includes(target.role)) {
    throw new ForbiddenError("Admins may only manage staff and borrower accounts.");
  }
}

export class UserService {
  constructor(
    private readonly profileRepository: IProfileRepository = new ProfileRepository()
  ) {}

  async getMe(actor: ActorContext): Promise<ProfileDTO> {
    // Record presence while loading the current profile (throttled in repo).
    try {
      await this.profileRepository.touchLastActive(actor.userId);
    } catch {
      // Best-effort — presence should not fail the profile load.
    }

    const row = await this.profileRepository.findByUserId(actor.userId);
    if (!row) {
      throw new NotFoundError("Profile", actor.userId);
    }
    return toProfileDTO(row);
  }

  /**
   * Best-effort last-active stamp for layouts / session gates.
   * Does not throw.
   */
  async recordActivity(userId: string): Promise<void> {
    try {
      await this.profileRepository.touchLastActive(userId);
    } catch {
      // ignore
    }
  }

  async updateMe(rawInput: unknown, actor: ActorContext): Promise<ProfileDTO> {
    const input = updateMeSchema.parse(rawInput);
    const existing = await this.profileRepository.findByUserId(actor.userId);
    if (!existing) {
      throw new NotFoundError("Profile", actor.userId);
    }

    const updated = await this.profileRepository.update(actor.userId, {
      ...(input.name !== undefined ? { fullName: input.name } : {}),
      ...(input.department !== undefined ? { department: input.department } : {}),
    });

    if (!updated) {
      throw new NotFoundError("Profile", actor.userId);
    }

    if (input.name !== undefined) {
      try {
        const admin = createAdminClient();
        await admin.auth.admin.updateUserById(actor.userId, {
          user_metadata: { full_name: input.name },
        });
      } catch {
        // Profile update already succeeded; auth metadata is optional.
      }
    }

    return toProfileDTO(updated);
  }

  async changePassword(
    rawInput: unknown,
    actor: ActorContext
  ): Promise<{ updated: true }> {
    const input = changePasswordSchema.parse(rawInput);
    const email =
      actor.email ??
      (await this.profileRepository.findByUserId(actor.userId))?.email;

    if (!email) {
      throw new BadRequestError("Your account has no email to verify against.");
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anonKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be configured."
      );
    }

    const verifier = createSupabaseClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email,
      password: input.currentPassword,
    });
    if (verifyError) {
      throw new BadRequestError("Current password is incorrect.");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: input.newPassword,
    });
    if (error) {
      throw new BadRequestError(error.message || "Failed to update password.");
    }

    return { updated: true };
  }

  async listUsersForActor(
    actor: ActorContext,
    rawQuery: unknown
  ): Promise<ProfileDTO[]> {
    const filters: ListUsersFilters = listUsersQuerySchema.parse(rawQuery ?? {});
    const rows = await this.profileRepository.list(filters);

    return rows
      .filter((row) => {
        if (actor.role === "superadmin") return true;
        // Admins never see superadmin profiles
        if (row.role === "superadmin") return false;
        return true;
      })
      .map(toProfileDTO);
  }

  async createUser(
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ProfileDTO> {
    const input: CreateUserInput = createUserSchema.parse(rawInput);
    assertCanAssignRole(actor, input.role);

    const email = input.email.trim().toLowerCase();
    const existing = await this.profileRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError("A profile with this email already exists.");
    }

    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.name.trim(),
      },
    });

    if (error || !data.user) {
      const message = error?.message ?? "Failed to create auth user.";
      if (message.toLowerCase().includes("already")) {
        throw new ConflictError(
          "This email is already registered. Use a different email or edit the existing account."
        );
      }
      throw new BadRequestError(message);
    }

    try {
      const row = await this.profileRepository.create({
        userId: data.user.id,
        email,
        fullName: input.name.trim(),
        role: input.role,
        status: "active",
        department: input.department?.trim() || null,
        createdByUserId: actor.userId,
        lastActiveAt: null,
      });

      return toProfileDTO(row);
    } catch (error) {
      // Roll back auth user if profile insert fails so admins can retry cleanly
      try {
        await admin.auth.admin.deleteUser(data.user.id);
      } catch {
        // Best-effort cleanup
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        String((error as { code: unknown }).code) === "23505"
      ) {
        throw new ConflictError("A profile with this email already exists.");
      }
      throw error;
    }
  }

  async updateUser(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ProfileDTO> {
    const userId = userIdSchema.parse(rawId);
    const input: UpdateUserInput = updateUserSchema.parse(rawInput);

    const existing = await this.profileRepository.findByUserId(userId);
    if (!existing) {
      throw new NotFoundError("User", userId);
    }

    assertCanMutateTarget(actor, existing);

    if (input.role !== undefined) {
      assertCanAssignRole(actor, input.role);
    }

    // Password changes go through Supabase Auth admin API only
    if (input.password) {
      const admin = createAdminClient();
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password: input.password,
      });
      if (error) {
        throw new BadRequestError(
          error.message || "Failed to update user password."
        );
      }
    }

    const hasProfileFields =
      input.name !== undefined ||
      input.role !== undefined ||
      input.department !== undefined ||
      input.status !== undefined;

    let updated: ProfileRow | null = existing;

    if (hasProfileFields) {
      updated = await this.profileRepository.update(userId, {
        ...(input.name !== undefined ? { fullName: input.name } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.department !== undefined
          ? { department: input.department }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      });

      if (!updated) {
        throw new NotFoundError("User", userId);
      }
    }

    // Sync display name onto auth metadata (best-effort)
    if (input.name !== undefined) {
      try {
        const admin = createAdminClient();
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: { full_name: input.name },
        });
      } catch {
        // Profile update already succeeded; auth metadata is optional.
      }
    }

    // Ban/unban auth session on deactivate/reactivate
    if (input.status !== undefined) {
      try {
        const admin = createAdminClient();
        await admin.auth.admin.updateUserById(userId, {
          ban_duration: input.status === "deactivated" ? "876000h" : "none",
        });
      } catch {
        // Profile is source of truth for app access either way.
      }
    }

    // Password-only update: re-read for fresh DTO
    if (!hasProfileFields) {
      const row = await this.profileRepository.findByUserId(userId);
      if (!row) throw new NotFoundError("User", userId);
      return toProfileDTO(row);
    }

    return toProfileDTO(updated!);
  }

  async deactivateUser(rawId: string, actor: ActorContext): Promise<ProfileDTO> {
    return this.updateUser(rawId, { status: "deactivated" }, actor);
  }

  async reactivateUser(rawId: string, actor: ActorContext): Promise<ProfileDTO> {
    return this.updateUser(rawId, { status: "active" }, actor);
  }
}
