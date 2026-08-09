"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import GlobalHeader from "@/components/global-header";
import { cn } from "@/lib/utils";
import { useMeQuery } from "@/features/users/client";
import { useDashboardSnapshotQuery } from "@/features/dashboard/client/use-dashboard";
import { ROLE_DEFINITIONS } from "@/constants/roles";

import type { UserRole } from "@/types/users";

interface DashboardLayoutProps {
  children: React.ReactNode;
  initialProfile?: {
    name: string;
    email: string;
    role: UserRole;
  };
}

export default function DashboardLayout({ children, initialProfile }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: me, isLoading: meLoading } = useMeQuery();
  const { data: snapshot } = useDashboardSnapshotQuery();

  const userName = me?.name ?? initialProfile?.name ?? (meLoading ? "Loading…" : "Unknown user");
  const userEmail = me?.email ?? initialProfile?.email ?? "";
  
  const currentRole = me?.role ?? initialProfile?.role;
  const userRoleLabel = currentRole ? ROLE_DEFINITIONS[currentRole].title : meLoading ? "…" : "—";
  
  const pendingCount = snapshot?.summary.pendingApprovals ?? 0;
  const overdueCount = snapshot?.summary.overdueAssets ?? 0;
  const lowStockCount = snapshot?.summary.lowStockItems ?? 0;

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#F2F3F7] text-[#1B2140]">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar 
          userName={userName} 
          userEmail={userEmail} 
          userRole={currentRole}
          pendingCount={pendingCount}
          overdueCount={overdueCount}
          lowStockCount={lowStockCount}
        />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-300 ease-in-out",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div
          onClick={() => setIsMobileOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        />

        <div
          className={cn(
            "absolute inset-y-0 left-0 w-64 bg-primary transition-transform duration-300 ease-in-out shadow-2xl flex flex-col",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar
            className="border-r-0 w-full h-full"
            userName={userName}
            userEmail={userEmail}
            userRole={currentRole}
            pendingCount={pendingCount}
            overdueCount={overdueCount}
            lowStockCount={lowStockCount}
          />
        </div>
      </div>

      <div
        className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden bg-[#F2F3F7] text-[#1B2140]"
        data-theme="light"
      >
        <GlobalHeader
          onMobileMenuOpen={() => setIsMobileOpen(true)}
          userName={userName}
          userRoleLabel={userRoleLabel}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-[#F2F3F7] focus:outline-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
