import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { UnauthorizedError } from "@/server/shared/errors";

/**
 * Verifies the request has a valid Supabase session.
 * Use at the start of protected Route Handlers / controllers.
 * Middleware is the first gate; this is defense-in-depth for `/api/*`.
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
