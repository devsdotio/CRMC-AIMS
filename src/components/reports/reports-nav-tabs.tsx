"use client";

import {
  LayoutDashboard,
  Package,
  Repeat,
  Wrench,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimpleReportCategory } from "./types";

interface ReportsNavTabsProps {
  activeTab: SimpleReportCategory;
  onTabChange: (tab: SimpleReportCategory) => void;
}

const TABS: { id: SimpleReportCategory; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Dashboard / Analytics", icon: LayoutDashboard },
  { id: "asset-inventory", label: "Asset Inventory Summary", icon: Package },
  { id: "borrowing", label: "Borrowing & Lending", icon: Repeat },
  { id: "maintenance", label: "Maintenance & Condition", icon: Wrench },
  { id: "procurement", label: "Procurement / Acquisition", icon: ShoppingBag },
  { id: "disposal", label: "Disposal & Write-off", icon: Trash2 },
];

export function ReportsNavTabs({ activeTab, onTabChange }: ReportsNavTabsProps) {
  return (
    <div className="bg-card border-b border-border px-4 md:px-6 shrink-0 overflow-x-auto no-scrollbar select-none">
      <nav className="flex space-x-1 min-w-max" aria-label="Report Category Tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-xs font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap",
                isActive
                  ? "border-accent text-accent font-bold bg-bg-subtle/50"
                  : "border-transparent text-text-secondary hover:text-text hover:bg-bg-subtle/30"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
