import { headers } from "next/headers";
import { redirect } from "next/navigation";

import DashboardLayout from "@/components/dashboard-layout";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";
import { profiles } from "@/server/db/schema";
import { UserService } from "@/server/modules/users/user.service";
import { isStaffShellRole, type AppRole } from "@/server/shared/roles";
import { eq } from "drizzle-orm";

/**
 * Authenticated app shell gate.
 *
 * Do not call supabase.auth.signOut() here and then redirect.
 * Cookie clears from Server Components often never land on the redirect
 * response → proxy still sees a session → bounce loop.
 *
 * Gate-failure redirects use `?error=…` and SignInForm clears the session.
 *
 * Borrowers share this shell (role-filtered sidebar) but may only open
 * `/borrower-db/*`. Staff shell roles may open the rest of the app.
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
    console.error("[private-layout] profile lookup failed:", error);
    redirect("/sign-in?error=no_profile");
  }

  if (!profile) {
    redirect("/sign-in?error=no_profile");
  }

  if (profile.status !== "active") {
    redirect("/sign-in?error=deactivated");
  }

  const role = profile.role as AppRole;
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
  const onBorrowerPortal =
    pathname === "/borrower-db" || pathname.startsWith("/borrower-db/");

  if (role === "borrower") {
    // Keep borrowers out of staff routes without a sign-in error bounce loop.
    // Empty pathname = header missing; do not self-redirect in that case.
    if (pathname && !onBorrowerPortal) {
      redirect("/borrower-db/dashboard");
    }
  } else if (!isStaffShellRole(role)) {
    redirect("/sign-in?error=no_profile");
  } else if (pathname && onBorrowerPortal) {
    // Staff accidentally at borrower URLs → staff home (RouteGuard does the same).
    redirect("/dashboard");
  }

  // Best-effort presence (never block entry)
  void new UserService().recordActivity(user.id);

  return (
    <DashboardLayout
      initialProfile={{
        name: profile.fullName,
        email: profile.email,
        role: profile.role as AppRole,
      }}
    >
      {children}
    </DashboardLayout>
  );
}
