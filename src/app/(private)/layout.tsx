import { redirect } from "next/navigation";

import DashboardLayout from "@/components/dashboard-layout";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";
import { profiles } from "@/server/db/schema";
import { UserService } from "@/server/modules/users/user.service";
import { isStaffShellRole, type AppRole } from "@/server/shared/roles";
import { eq } from "drizzle-orm";

/**
 * Staff shell gate.
 *
 * Do not call supabase.auth.signOut() here and then redirect.
 * Cookie clears from Server Components often never land on the redirect
 * response → proxy still sees a session → bounces you back to /dashboard
 * (GET /dashboard 307 forever).
 *
 * Gate-failure redirects use `?error=…` and SignInForm clears the session.
 */
export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  let profile: typeof profiles.$inferSelect | undefined;
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);
    profile = rows[0];
  } catch (error) {
    // DB timeout / network: fail closed with a recoverable sign-in state
    console.error("[private-layout] profile lookup failed:", error);
    redirect("/sign-in?error=no_profile");
  }

  if (!profile) {
    redirect("/sign-in?error=no_profile");
  }

  if (profile.status !== "active") {
    redirect("/sign-in?error=deactivated");
  }

  if (!isStaffShellRole(profile.role as AppRole)) {
    redirect("/sign-in?error=borrower_portal");
  }

  // Best-effort presence (never block entry)
  void new UserService().recordActivity(user.id);

  return <DashboardLayout>{children}</DashboardLayout>;
}
