"use client";

import { Search, FilterX, ArrowUpDown, Tag, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssetFilterState, AssetCategory, AssetStatus } from "./types";

export interface AssetFiltersProps {
  filters: AssetFilterState;
  onFilterChange: (updated: Partial<AssetFilterState>) => void;
  onResetFilters: () => void;
  totalAssetsCount: number;
  filteredAssetsCount: number;
}

const CATEGORIES: { id: AssetCategory; label: string; bg: string; text: string }[] = [
  { id: "computing", label: "Computing", bg: "bg-category-computing-bg", text: "text-category-computing-text" },
  { id: "av",        label: "AV Equipment", bg: "bg-category-av-bg", text: "text-category-av-text" },
  { id: "transport", label: "Transport", bg: "bg-category-transport-bg", text: "text-category-transport-text" },
  { id: "furniture", label: "Furniture", bg: "bg-category-furniture-bg", text: "text-category-furniture-text" },
];

const STATUSES: { id: AssetStatus; label: string; bg: string; text: string }[] = [
  { id: "active",         label: "Active",         bg: "bg-status-active-bg/20",     text: "text-status-active-text" },
  { id: "needs_repair",   label: "Needs Repair",   bg: "bg-status-repair-bg/20",     text: "text-status-repair-text" },
  { id: "out_of_service", label: "Out of Service", bg: "bg-status-outofservice-bg/20", text: "text-status-outofservice-text" },
  { id: "retired",        label: "Retired",        bg: "bg-status-retired-bg/20",    text: "text-status-retired-text" },
];

export function AssetFilters({
  filters,
  onFilterChange,
  onResetFilters,
}: AssetFiltersProps) {
  const activeCount =
    (filters.searchQuery ? 1 : 0) +
    filters.categories.length +
    filters.statuses.length;

  const toggleCategory = (catId: AssetCategory) => {
    const exists = filters.categories.includes(catId);
    const updated = exists
      ? filters.categories.filter((c) => c !== catId)
      : [...filters.categories, catId];
    onFilterChange({ categories: updated });
  };

  const toggleStatus = (statusId: AssetStatus) => {
    const exists = filters.statuses.includes(statusId);
    const updated = exists
      ? filters.statuses.filter((s) => s !== statusId)
      : [...filters.statuses, statusId];
    onFilterChange({ statuses: updated });
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:px-6 bg-bg border-b border-border shrink-0">
      {/* Row 1: Search & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-60 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search by asset name, code, or serial number…"
            className={cn(
              "w-full h-9 pl-9 pr-3 text-xs bg-bg-subtle border border-border rounded-lg text-text placeholder:text-text-secondary/60",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
            )}
          />
        </div>

        {/* Sort & Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-text-secondary" />
            <label htmlFor="asset-sort" className="text-text-secondary font-medium hidden sm:inline">
              Sort:
            </label>
            <select
              id="asset-sort"
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange({ sortBy: e.target.value as AssetFilterState["sortBy"] })
              }
              className="h-8 px-2.5 text-xs bg-bg-subtle border border-border rounded-lg text-text font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="name">Name (A-Z)</option>
              <option value="code">Asset Code</option>
              <option value="date">Recently Updated</option>
            </select>
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
            >
              <FilterX className="h-3.5 w-3.5" />
              Clear filters ({activeCount})
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Category & Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        {/* Categories */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-text-secondary mr-1 flex items-center gap-1">
            <Tag className="h-3 w-3 text-text-secondary" /> Category:
          </span>
          {CATEGORIES.map((cat) => {
            const isSelected = filters.categories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border",
                  isSelected
                    ? [cat.bg, cat.text, "border-current shadow-2xs font-bold ring-1 ring-accent/30"]
                    : "bg-bg-subtle text-text-secondary border-border hover:bg-border/60"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Statuses */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-text-secondary mr-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-text-secondary" /> Status:
          </span>
          {STATUSES.map((st) => {
            const isSelected = filters.statuses.includes(st.id);
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => toggleStatus(st.id)}
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border",
                  isSelected
                    ? [st.bg, st.text, "border-current shadow-2xs font-bold ring-1 ring-accent/30"]
                    : "bg-bg-subtle text-text-secondary border-border hover:bg-border/60"
                )}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
