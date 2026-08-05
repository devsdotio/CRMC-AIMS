"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import GlobalHeader from "@/components/global-header";
import { cn } from "@/lib/utils";
import { useMeQuery } from "@/features/users/client";
import { ROLE_DEFINITIONS } from "@/components/users/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: me, isLoading: meLoading } = useMeQuery();

  const userName = me?.name ?? (meLoading ? "Loading…" : "Unknown user");
  const userEmail = me?.email ?? "";
  const userRoleLabel = me ? ROLE_DEFINITIONS[me.role].title : meLoading ? "…" : "—";

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#F2F3F7] text-[#1B2140]">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar userName={userName} userEmail={userEmail} />
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
