import type { User } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";
import { profiles, type ProfileRow } from "@/server/db/schema";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/server/shared/errors";
import {
  type AppRole,
  hasMinRole,
  isAssetOperatorRole,
  isStaffShellRole,
  isUserManagerRole,
} from "@/server/shared/roles";

/** Extracts raw JWT from `Authorization: Bearer <token>` when present. */
async function getBearerToken(): Promise<string | null> {
  const headerStore = await headers();
  const authorization = headerStore.get("authorization");
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token || null;
}

/**
 * Accountability actor derived ONLY from a verified Supabase session + profile.
 * Never accept actor identity or role from the client body.
 */
export interface ActorContext {
  userId: string;
  email: string | null;
  displayName: string;
  role: AppRole;
}

export interface AppSession {
  user: User;
  actor: ActorContext;
  profile: ProfileRow;
}

export function toActorContext(user: User, profile: ProfileRow): ActorContext {
  return {
    userId: user.id,
    email: profile.email || user.email || null,
    displayName: profile.fullName || user.email || user.id,
    role: profile.role,
  };
}

async function loadProfile(userId: string): Promise<ProfileRow | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return row ?? null;
}

/**
 * Verifies the request has a valid Supabase session.
 *
 * Accepts either:
 * - HTTP-only session cookies (browser / SSR), or
 * - `Authorization: Bearer <access_token>` (Swagger, scripts, API clients)
 *
 * Use at the start of protected Route Handlers / controllers.
 */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const bearer = await getBearerToken();

  const {
    data: { user },
    error,
  } = bearer
    ? await supabase.auth.getUser(bearer)
    : await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

  return user;
}

/**
 * Session + profile gate. Rejects missing/deactivated profiles.
 */
export async function requireSession(): Promise<AppSession> {
  const user = await requireUser();
  const profile = await loadProfile(user.id);

  if (!profile) {
    throw new ForbiddenError(
      "No application profile is linked to this account. Contact an administrator."
    );
  }

  if (profile.status !== "active") {
    throw new ForbiddenError("This account has been deactivated.");
  }

  return {
    user,
    profile,
    actor: toActorContext(user, profile),
  };
}

/** Session gate + actor context for accountable mutations. */
export async function requireActor(): Promise<ActorContext> {
  const session = await requireSession();
  return session.actor;
}

export async function requireRoles(
  ...allowed: AppRole[]
): Promise<AppSession> {
  const session = await requireSession();
  if (!allowed.includes(session.profile.role)) {
    throw new ForbiddenError(
      "You do not have permission to perform this action."
    );
  }
  return session;
}

export async function requireMinRole(minimum: AppRole): Promise<AppSession> {
  const session = await requireSession();
  if (!hasMinRole(session.profile.role, minimum)) {
    throw new ForbiddenError(
      "You do not have permission to perform this action."
    );
  }
  return session;
}

export async function requireStaffShell(): Promise<AppSession> {
  const session = await requireSession();
  if (!isStaffShellRole(session.profile.role)) {
    throw new ForbiddenError(
      "Staff workspace access is limited to superadmin, admin, and staff accounts."
    );
  }
  return session;
}

export async function requireUserManager(): Promise<AppSession> {
  const session = await requireSession();
  if (!isUserManagerRole(session.profile.role)) {
    throw new ForbiddenError("Only admins can manage user accounts.");
  }
  return session;
}

export async function requireAssetOperator(): Promise<AppSession> {
  const session = await requireSession();
  if (!isAssetOperatorRole(session.profile.role)) {
    throw new ForbiddenError(
      "Only staff and administrators can manage coded assets."
    );
  }
  return session;
}

/** Soft lookup for layouts (returns null instead of throwing). */
export async function getSessionOrNull(): Promise<AppSession | null> {
  try {
    return await requireSession();
  } catch {
    return null;
  }
}
