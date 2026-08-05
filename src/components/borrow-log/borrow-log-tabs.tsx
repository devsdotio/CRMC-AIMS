"use client";

import { useRef, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { LogTabFilter } from "@/types/borrow-log";

export interface BorrowLogTabsProps {
  activeTab: LogTabFilter;
  onTabChange: (tab: LogTabFilter) => void;
  activeCount: number;
  overdueCount: number;
  returnedCount: number;
  totalCount: number;
}

interface TabItem {
  id: LogTabFilter;
  label: string;
  count: number;
  badgeStyle?: "accent" | "danger" | "default";
}

export function BorrowLogTabs({
  activeTab,
  onTabChange,
  activeCount,
  overdueCount,
  returnedCount,
  totalCount,
}: BorrowLogTabsProps) {
  const tabRefs = useRef<Record<LogTabFilter, HTMLButtonElement | null>>({
    active: null,
    overdue: null,
    returned: null,
    all: null,
  });

  const tabs: TabItem[] = [
    { id: "active", label: "Active Borrowings", count: activeCount, badgeStyle: "accent" },
    { id: "overdue", label: "Overdue", count: overdueCount, badgeStyle: "danger" },
    { id: "returned", label: "Returned Logs", count: returnedCount, badgeStyle: "default" },
    { id: "all", label: "All Transactions", count: totalCount, badgeStyle: "default" },
  ];

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentId: LogTabFilter) => {
    const tabOrder: LogTabFilter[] = ["active", "overdue", "returned", "all"];
    const currentIndex = tabOrder.indexOf(currentId);
    let nextIndex = -1;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabOrder.length;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = tabOrder.length - 1;
    }

    if (nextIndex !== -1) {
      const nextTabId = tabOrder[nextIndex];
      onTabChange(nextTabId);
      tabRefs.current[nextTabId]?.focus();
    }
  };

  return (
    <div className="border-b border-border bg-bg px-4 md:px-6 pt-2 shrink-0">
      <nav
        role="tablist"
        aria-label="Borrow log transaction filters"
        className="flex items-center gap-6 overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className={cn(
                "relative flex items-center gap-2 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-t-md",
                isActive
                  ? "text-text"
                  : "text-text-secondary hover:text-text"
              )}
            >
              <span>{tab.label}</span>

              {/* Count Badge */}
              {tab.badgeStyle === "danger" && tab.count > 0 ? (
                <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold rounded-full bg-status-outofservice-bg text-status-outofservice-text tabular-nums shrink-0 shadow-xs">
                  {tab.count}
                </span>
              ) : tab.badgeStyle === "accent" && tab.count > 0 ? (
                <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold rounded-full bg-accent text-accent-foreground tabular-nums shrink-0">
                  {tab.count}
                </span>
              ) : (
                <span className={cn("text-xs font-normal tabular-nums", isActive ? "font-semibold text-text-secondary" : "text-text-secondary/60")}>
                  ({tab.count})
                </span>
              )}

              {/* Underline indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-accent rounded-t-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
