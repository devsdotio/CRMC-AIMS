import { redirect } from "next/navigation";

import DashboardLayout from "@/components/dashboard-layout";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";
import { profiles } from "@/server/db/schema";
import { isStaffShellRole, type AppRole } from "@/server/shared/roles";
import { eq } from "drizzle-orm";

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

  const db = getDb();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);

  if (!profile) {
    await supabase.auth.signOut();
    redirect("/sign-in?error=no_profile");
  }

  if (profile.status !== "active") {
    await supabase.auth.signOut();
    redirect("/sign-in?error=deactivated");
  }

  if (!isStaffShellRole(profile.role as AppRole)) {
    // Borrowers are authenticated but not admitted into the staff workspace yet.
    redirect("/sign-in?error=borrower_portal");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
