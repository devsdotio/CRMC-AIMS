import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { UnauthorizedError } from "@/server/shared/errors";

/**
 * Accountability actor derived ONLY from a verified Supabase session.
 * Never accept actor identity from the client body.
 */
export interface ActorContext {
  userId: string;
  email: string | null;
  displayName: string;
}

export function toActorContext(user: User): ActorContext {
  const metadata = user.user_metadata ?? {};
  const fullName =
    typeof metadata.full_name === "string"
      ? metadata.full_name.trim()
      : typeof metadata.name === "string"
        ? metadata.name.trim()
        : "";

  return {
    userId: user.id,
    email: user.email ?? null,
    displayName: fullName || user.email || user.id,
  };
}

/**
 * Verifies the request has a valid Supabase session.
 * Use at the start of protected Route Handlers / controllers.
 * Proxy is the first gate; this is defense-in-depth for `/api/*`.
 */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

  return user;
}

/** Session gate + actor context for accountable mutations. */
export async function requireActor(): Promise<ActorContext> {
  const user = await requireUser();
  return toActorContext(user);
}
