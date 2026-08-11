import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";
import { profiles } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { isStaffShellRole, type AppRole } from "@/server/shared/roles";

interface RouteGuardProps {
  children: ReactNode;
  config: {
    allowedRoles: AppRole[];
    /** Override role-mismatch target (default is role home). */
    fallbackRoute?: string;
  };
}

function homeForRole(role: AppRole): string {
  if (role === "borrower") return "/borrower-db/dashboard";
  if (isStaffShellRole(role)) return "/dashboard";
  return "/sign-in";
}

export async function RouteGuard({ children, config }: RouteGuardProps) {
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

  if (!profile || profile.status !== "active") {
    redirect("/sign-in");
  }

  const role = profile.role as AppRole;

  if (!config.allowedRoles.includes(role)) {
    // Send mismatched roles to *their* home — never bounce admin→/dashboard
    // when /dashboard is the page that already denied them (self-loop).
    redirect(config.fallbackRoute ?? homeForRole(role));
  }

  return <>{children}</>;
}
