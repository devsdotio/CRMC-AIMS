"use client";

import { Search, FilterX, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BorrowLogFilterState } from "./types";
import { MOCK_DEPARTMENTS } from "./mock-data";

export interface BorrowLogFiltersProps {
  filters: BorrowLogFilterState;
  onFilterChange: (updated: Partial<BorrowLogFilterState>) => void;
  onResetFilters: () => void;
}

export function BorrowLogFilters({
  filters,
  onFilterChange,
  onResetFilters,
}: BorrowLogFiltersProps) {
  const isFiltered =
    Boolean(filters.searchQuery) ||
    (Boolean(filters.department) && filters.department !== "All Departments") ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  return (
    <div className="flex flex-col gap-3 p-4 md:px-6 bg-bg border-b border-border shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search by borrower, asset tag, or LOG code…"
            className={cn(
              "w-full h-9 pl-9 pr-3 text-xs bg-bg-subtle border border-border rounded-lg text-text placeholder:text-text-secondary/60",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
            )}
          />
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Select */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="log-dept-filter" className="sr-only">
              Filter by department
            </label>
            <select
              id="log-dept-filter"
              value={filters.department}
              onChange={(e) => onFilterChange({ department: e.target.value })}
              className="h-9 px-3 text-xs bg-bg-subtle border border-border rounded-lg text-text font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
            >
              {MOCK_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Date range inputs */}
          <div className="flex items-center gap-1.5 bg-bg-subtle border border-border rounded-lg px-2 py-1">
            <Calendar className="h-3.5 w-3.5 text-text-secondary shrink-0" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              aria-label="Start date"
              className="h-7 bg-transparent text-xs text-text focus:outline-none"
            />
            <span className="text-xs text-text-secondary/60">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              aria-label="End date"
              className="h-7 bg-transparent text-xs text-text focus:outline-none"
            />
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
