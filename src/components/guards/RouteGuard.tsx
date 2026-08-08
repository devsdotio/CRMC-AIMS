import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";
import { profiles } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { type AppRole } from "@/server/shared/roles";

interface RouteGuardProps {
  children: ReactNode;
  config: {
    allowedRoles: AppRole[];
    fallbackRoute?: string;
  };
}

export async function RouteGuard({ children, config }: RouteGuardProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(config.fallbackRoute ?? '/sign-in');
  }

  const db = getDb();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);

  if (!profile || profile.status !== "active") {
    redirect(config.fallbackRoute ?? '/sign-in');
  }

  const role = profile.role as AppRole;

  // Role mismatch: redirect silently to their own default/home route
  if (!config.allowedRoles.includes(role)) {
    if (role === 'admin' || role === 'superadmin') {
      redirect('/dashboard');
    } else if (role === 'borrower') {
      redirect('/borrower-db/dashboard');
    } else {
      // Unknown role safely falls back
      redirect(config.fallbackRoute ?? '/sign-in');
    }
  }

  return <>{children}</>;
}
