"use client";

import { ReactNode } from "react";
import { ClipboardList, FileText, ShoppingCart, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditLogTab } from "@/app/(private)/audit-logs/page";

interface AuditLogsLayoutProps {
  activeTab: AuditLogTab;
  onTabChange: (tab: AuditLogTab) => void;
  children: ReactNode;
}

const TABS: { id: AuditLogTab; label: string; icon: any }[] = [
  { id: "borrow-requests", label: "Borrow Requests", icon: ClipboardList },
  { id: "general", label: "General", icon: FileText },
  { id: "requisitions", label: "Requisitions", icon: FileSpreadsheet },
  { id: "purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
];

export function AuditLogsLayout({ activeTab, onTabChange, children }: AuditLogsLayoutProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg">
      <div className="px-4 md:px-6 border-b border-border bg-bg-subtle shrink-0">
        <div className="flex gap-6 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-text-secondary hover:text-text hover:border-border"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        {children}
      </div>
    </div>
  );
}
