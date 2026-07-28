"use client";

import { Search, FilterX, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsumableFilterState } from "./types";
import { CONSUMABLE_CATEGORIES } from "./mock-data";

export interface ConsumableFiltersProps {
  filters: ConsumableFilterState;
  onFilterChange: (updated: Partial<ConsumableFilterState>) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export function ConsumableFilters({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
}: ConsumableFiltersProps) {
  const isFiltered =
    Boolean(filters.searchQuery) ||
    (Boolean(filters.category) && filters.category !== "all") ||
    filters.stockLevel !== "all";

  return (
    <div className="flex flex-col gap-3 p-4 md:px-6 bg-bg border-b border-border shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search consumable supplies by name or item code…"
            className={cn(
              "w-full h-9 pl-9 pr-3 text-xs bg-bg-subtle border border-border rounded-lg text-text placeholder:text-text-secondary/60",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
            )}
          />
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="consumable-category-filter" className="sr-only">
              Filter by supply category
            </label>
            <select
              id="consumable-category-filter"
              value={filters.category}
              onChange={(e) => onFilterChange({ category: e.target.value })}
              className="h-9 px-3 text-xs bg-bg-subtle border border-border rounded-lg text-text font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
            >
              {CONSUMABLE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter Select */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="stock-level-filter" className="sr-only">
              Filter by stock level
            </label>
            <select
              id="stock-level-filter"
              value={filters.stockLevel}
              onChange={(e) => onFilterChange({ stockLevel: e.target.value as any })}
              className="h-9 px-3 text-xs bg-bg-subtle border border-border rounded-lg text-text font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
            >
              <option value="all">All Stock Levels</option>
              <option value="critical">Critical / Out of Stock</option>
              <option value="low">Low Stock</option>
              <option value="healthy">Healthy Stock</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-text-secondary" />
            <select
              id="consumable-sort"
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
              className="h-9 px-2.5 text-xs bg-bg-subtle border border-border rounded-lg text-text font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="critical">Sort: Most Critical First</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="qty">Sort: Current Qty</option>
              <option value="updated">Sort: Recently Restocked</option>
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 h-9 px-3 text-xs font-semibold text-accent hover:bg-bg-subtle rounded-lg border border-border transition-colors cursor-pointer"
            >
              <FilterX className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
