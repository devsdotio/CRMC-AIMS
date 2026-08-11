"use client";

import { useRef, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { TabFilter } from "@/types/borrow-requests";

export interface BorrowRequestTabsProps {
  activeTab: TabFilter;
  onTabChange: (tab: TabFilter) => void;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  releasedCount: number;
  returnedCount: number;
  totalCount: number;
}

interface TabItem {
  id: TabFilter;
  label: string;
  count: number;
  showBadge?: boolean;
}

export function BorrowRequestTabs({
  activeTab,
  onTabChange,
  pendingCount,
  approvedCount,
  rejectedCount,
  releasedCount,
  returnedCount,
  totalCount,
}: BorrowRequestTabsProps) {
  const tabRefs = useRef<Record<TabFilter, HTMLButtonElement | null>>({
    pending: null,
    approved: null,
    rejected: null,
    released: null,
    returned: null,
    all: null,
  });

  const tabs: TabItem[] = [
    { id: "pending", label: "Pending", count: pendingCount, showBadge: true },
    { id: "approved", label: "Approved", count: approvedCount },
    { id: "rejected", label: "Rejected", count: rejectedCount },
    { id: "released", label: "Released", count: releasedCount },
    { id: "returned", label: "Returned", count: returnedCount },
    { id: "all", label: "All Requests", count: totalCount },
  ];

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentId: TabFilter) => {
    const tabOrder: TabFilter[] = ["pending", "approved", "rejected", "released", "returned", "all"];
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
        aria-label="Borrow request status filters"
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

              {/* Count badge */}
              {tab.showBadge && tab.count > 0 ? (
                <span
                  className={cn(
                    "flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold rounded-full tabular-nums shrink-0",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "bg-status-repair-bg/20 text-text"
                  )}
                >
                  {tab.count > 99 ? "99+" : tab.count}
                </span>
              ) : (
                <span
                  className={cn(
                    "text-xs font-normal tabular-nums",
                    isActive ? "text-text-secondary font-semibold" : "text-text-secondary/60"
                  )}
                >
                  ({tab.count})
                </span>
              )}

              {/* Active underline indicator */}
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
