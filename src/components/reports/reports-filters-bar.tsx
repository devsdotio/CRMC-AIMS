"use client";

import { Search, RotateCcw } from "lucide-react";
import type { SimpleReportFilterState } from "./types";

interface ReportsFiltersBarProps {
  filters: SimpleReportFilterState;
  onFilterChange: (updated: Partial<SimpleReportFilterState>) => void;
  onResetFilters: () => void;
}

export function ReportsFiltersBar({
  filters,
  onFilterChange,
  onResetFilters,
}: ReportsFiltersBarProps) {
  const isFiltered =
    filters.department !== "all" ||
    filters.category !== "all" ||
    filters.status !== "all" ||
    Boolean(filters.searchQuery);

  return (
    <div className="flex flex-col gap-3 bg-card px-4 py-3 md:px-6 border-b border-border shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Query Input */}
        <div className="relative flex-1 min-w-60 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search report items by tag, name, or serial number…"
            className="w-full h-9 pl-9 pr-3 text-xs bg-bg-subtle border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ dateRange: e.target.value })}
            className="h-9 px-2.5 text-xs bg-bg-subtle border border-border rounded-lg font-medium text-text focus:outline-none cursor-pointer"
          >
            <option value="cy-2026">Current Year (2026)</option>
            <option value="last-30">Last 30 Days</option>
            <option value="last-90">Last 90 Days</option>
            <option value="all-time">All Time</option>
          </select>

          {/* Department Selector */}
          <select
            value={filters.department}
            onChange={(e) => onFilterChange({ department: e.target.value })}
            className="h-9 px-2.5 text-xs bg-bg-subtle border border-border rounded-lg font-medium text-text focus:outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="Nursing">Nursing</option>
            <option value="Medical Technology">Medical Technology</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Communications">Communications</option>
          </select>

          {/* Asset Category Selector */}
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="h-9 px-2.5 text-xs bg-bg-subtle border border-border rounded-lg font-medium text-text focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="AV Equipment">AV Equipment</option>
            <option value="Computing">Computing</option>
            <option value="Lab Tools">Lab Tools</option>
            <option value="Furniture">Furniture</option>
          </select>

          {/* Status Selector */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="h-9 px-2.5 text-xs bg-bg-subtle border border-border rounded-lg font-medium text-text focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="In Use">In Use</option>
            <option value="In Storage">In Storage</option>
            <option value="Under Repair">Under Repair</option>
            <option value="Disposed">Disposed</option>
          </select>

          {/* Reset Action */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 h-9 px-3 text-xs font-semibold text-accent hover:bg-bg-subtle rounded-lg border border-border transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
