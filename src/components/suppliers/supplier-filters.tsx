"use client";

import { Search, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupplierFilterState } from "@/types/suppliers";

export function SupplierFilters({
  filters,
  onFilterChange,
  onResetFilters,
}: {
  filters: SupplierFilterState;
  onFilterChange: (updated: Partial<SupplierFilterState>) => void;
  onResetFilters: () => void;
}) {
  const isFiltered =
    Boolean(filters.searchQuery) ||
    (Boolean(filters.status) && filters.status !== "all");

  return (
    <div className="flex flex-col gap-3 p-4 md:px-6 bg-bg border-b border-border shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-60 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search by name, code, or contact…"
            className={cn(
              "w-full h-9 pl-9 pr-3 text-xs bg-bg-subtle border border-border rounded-lg text-text placeholder:text-text-secondary/60",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
            )}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="h-9 px-3 text-xs bg-bg-subtle border border-border rounded-lg text-text font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold text-text-secondary hover:text-text border border-border rounded-lg bg-bg-subtle hover:bg-bg transition-colors cursor-pointer"
            >
              <FilterX className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
