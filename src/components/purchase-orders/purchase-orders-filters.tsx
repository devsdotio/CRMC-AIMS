"use client";

import React from "react";
import {
  Search,
  X,
  RotateCcw,
  LayoutList,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PurchaseOrderViewMode = "table" | "grid";
export type PurchaseOrderItemTypeFilter = "all" | "consumable" | "asset";
export type PurchaseOrderStockFilter = "all" | "in_stock" | "low_stock" | "depleted";
export type PurchaseOrderDateFilter = "all" | "30d" | "this_month" | "this_year" | "custom";

export interface PurchaseOrderFilterState {
  search: string;
  itemType: PurchaseOrderItemTypeFilter;
  stockStatus: PurchaseOrderStockFilter;
  supplierId: string;
  datePreset: PurchaseOrderDateFilter;
  startDate: string;
  endDate: string;
  viewMode: PurchaseOrderViewMode;
}

interface PurchaseOrdersFiltersProps {
  filters: PurchaseOrderFilterState;
  onFilterChange: (updates: Partial<PurchaseOrderFilterState>) => void;
  onResetFilters: () => void;
  supplierOptions: Array<{ value: string; label: string; count?: number }>;
  totalCount: number;
  filteredCount: number;
}

export function PurchaseOrdersFilters({
  filters,
  onFilterChange,
  onResetFilters,
  supplierOptions,
  totalCount,
  filteredCount,
}: PurchaseOrdersFiltersProps) {
  const isFiltered =
    Boolean(filters.search.trim()) ||
    filters.itemType !== "all" ||
    filters.stockStatus !== "all" ||
    Boolean(filters.supplierId) ||
    filters.datePreset !== "all" ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  const handleDatePreset = (preset: PurchaseOrderDateFilter) => {
    const today = new Date();
    let startDate = "";
    let endDate = "";

    if (preset === "30d") {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      startDate = past.toISOString().split("T")[0];
      endDate = today.toISOString().split("T")[0];
    } else if (preset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = firstDay.toISOString().split("T")[0];
      endDate = today.toISOString().split("T")[0];
    } else if (preset === "this_year") {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      startDate = firstDay.toISOString().split("T")[0];
      endDate = today.toISOString().split("T")[0];
    }

    onFilterChange({
      datePreset: preset,
      startDate: preset === "all" ? "" : startDate,
      endDate: preset === "all" ? "" : endDate,
    });
  };

  return (
    <div className="bg-bg p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-3.5 shrink-0">
      {/* Top Main Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[260px] max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search P.O number, description, suggested dealer, purpose..."
            className="w-full h-10 pl-10 pr-9 text-xs rounded-lg border border-border bg-bg-subtle/60 text-text placeholder:text-text-secondary focus:bg-bg focus:border-border focus:ring-2 focus:ring-ring focus:outline-hidden transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: "" })}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-secondary hover:text-text hover:bg-border/60 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap ml-auto">
          <div className="flex items-center h-10 rounded-lg border border-border bg-bg-subtle/80 p-1">
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: "table" })}
              title="Table View"
              className={cn(
                "h-8 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center justify-center",
                filters.viewMode === "table"
                  ? "bg-bg text-text shadow-2xs font-bold"
                  : "text-text-secondary hover:text-text"
              )}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: "grid" })}
              title="Card Grid View"
              className={cn(
                "h-8 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center justify-center",
                filters.viewMode === "grid"
                  ? "bg-bg text-text shadow-2xs font-bold"
                  : "text-text-secondary hover:text-text"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row: Item Type, Stock Status, Supplier, Date Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-border/50">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Item Type Segmented Chips */}
          <div className="flex items-center h-9 rounded-lg border border-border bg-bg-subtle/50 p-0.5 shadow-2xs">
            {(
              [
                { id: "all", label: "All Types" },
                { id: "consumable", label: "Consumables" },
                { id: "asset", label: "Fixed Assets" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onFilterChange({ itemType: t.id })}
                className={cn(
                  "h-7.5 px-3 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center",
                  filters.itemType === t.id
                    ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                    : "text-text-secondary hover:text-text hover:bg-bg-subtle"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Stock Status Filter */}
          <div className="flex items-center h-9 rounded-lg border border-border bg-bg-subtle/50 p-0.5 shadow-2xs">
            {(
              [
                { id: "all", label: "All Stock" },
                { id: "in_stock", label: "In Stock" },
                { id: "low_stock", label: "Low (≤20%)" },
                { id: "depleted", label: "Depleted" },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onFilterChange({ stockStatus: s.id })}
                className={cn(
                  "h-7.5 px-3 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center",
                  filters.stockStatus === s.id
                    ? "bg-bg text-text border border-border/80 font-bold shadow-2xs"
                    : "text-text-secondary hover:text-text hover:bg-bg-subtle"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Supplier Dropdown */}
          <div className="relative">
            <select
              value={filters.supplierId}
              onChange={(e) => onFilterChange({ supplierId: e.target.value })}
              className="appearance-none h-9 pl-3 pr-8 text-[11px] font-medium rounded-lg border border-border bg-bg text-text shadow-2xs focus:ring-2 focus:ring-ring focus:outline-hidden cursor-pointer"
            >
              <option value="">All Dealers / Suppliers ({supplierOptions.length})</option>
              {supplierOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {opt.count !== undefined ? `(${opt.count})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
          </div>

          {/* Date Filter Presets */}
          <div className="flex items-center gap-1">
            {(
              [
                { id: "all", label: "All Time" },
                { id: "30d", label: "30 Days" },
                { id: "this_month", label: "This Month" },
                { id: "this_year", label: "This Year" },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => handleDatePreset(d.id)}
                className={cn(
                  "h-9 px-3 rounded-md text-[11px] font-medium transition-colors cursor-pointer border flex items-center",
                  filters.datePreset === d.id && !filters.startDate
                    ? "border-border bg-bg-subtle text-text font-bold"
                    : "border-transparent text-text-secondary hover:text-text hover:bg-bg-subtle"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Count & Reset Filter */}
        <div className="flex items-center gap-2.5 ml-auto">
          <span className="text-[11px] text-text-secondary font-medium">
            Showing <strong className="text-text font-bold">{filteredCount}</strong> of{" "}
            {totalCount} batches
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[11px] font-semibold text-accent hover:bg-accent/10 transition-colors cursor-pointer"
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
