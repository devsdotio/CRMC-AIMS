"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import GlobalHeader from "@/components/global-header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#F2F3F7] text-[#1B2140]">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-300 ease-in-out",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop overlay */}
        <div
          onClick={() => setIsMobileOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        />

        {/* Sidebar Drawer container */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-64 bg-primary transition-transform duration-300 ease-in-out shadow-2xl flex flex-col",
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar className="border-r-0 w-full h-full" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden bg-[#F2F3F7] text-[#1B2140]" data-theme="light">
        {/* Global Dynamic Header */}
        <GlobalHeader onMobileMenuOpen={() => setIsMobileOpen(true)} />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-[#F2F3F7] focus:outline-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
