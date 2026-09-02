"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  RotateCcw,
  LayoutList,
  LayoutGrid,
  ChevronDown,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  Truck,
  PackageCheck,
  Ban,
  Boxes,
  Tag,
  Check,
  Layers,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PurchaseOrderStatus } from "@/types/purchase-lots";

export type PurchaseOrderViewMode = "table" | "grid";
export type PurchaseOrderItemTypeFilter = "all" | "consumable" | "asset";
export type PurchaseOrderStockFilter = "all" | "in_stock" | "low_stock" | "depleted";
export type PurchaseOrderDateFilter = "all" | "30d" | "this_month" | "this_year" | "custom";
export type PurchaseOrderStatusFilter = "all" | PurchaseOrderStatus;

export interface PurchaseOrderFilterState {
  search: string;
  itemType: PurchaseOrderItemTypeFilter;
  status: PurchaseOrderStatusFilter;
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

const STATUS_CONFIGS: Array<{
  id: PurchaseOrderStatusFilter;
  label: string;
  icon: React.ElementType;
  dotColor: string;
}> = [
  { id: "all", label: "All Statuses", icon: Layers, dotColor: "bg-text-secondary" },
  { id: "pending_approval", label: "Pending", icon: Clock, dotColor: "bg-amber-500" },
  { id: "approved", label: "Approved", icon: ShieldCheck, dotColor: "bg-blue-500" },
  { id: "ordered", label: "Ordered", icon: Truck, dotColor: "bg-indigo-500" },
  { id: "delivered", label: "Delivered", icon: PackageCheck, dotColor: "bg-emerald-500" },
  { id: "cancelled", label: "Cancelled", icon: Ban, dotColor: "bg-rose-500" },
];

export function PurchaseOrdersFilters({
  filters,
  onFilterChange,
  onResetFilters,
  supplierOptions,
}: PurchaseOrdersFiltersProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isDateOpen, setIsDateOpen] = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const supplierRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (statusRef.current && !statusRef.current.contains(target)) {
        setIsStatusOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(target)) {
        setIsTypeOpen(false);
      }
      if (supplierRef.current && !supplierRef.current.contains(target)) {
        setIsSupplierOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(target)) {
        setIsDateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isFiltered =
    Boolean(filters.search.trim()) ||
    filters.itemType !== "all" ||
    filters.status !== "all" ||
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
    if (preset !== "custom") {
      setIsDateOpen(false);
    }
  };

  const filteredSuppliers = supplierOptions.filter((s) =>
    s.label.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const selectedStatusConfig = STATUS_CONFIGS.find((s) => s.id === filters.status) || STATUS_CONFIGS[0];
  const selectedSupplierName =
    supplierOptions.find((s) => s.value === filters.supplierId)?.label ||
    (filters.supplierId ? filters.supplierId : null);

  return (
    <div className="bg-bg border-b border-border p-2.5 px-4 md:px-6 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Side: Search + Dropdown Filters in 1 Row */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search Input */}
          <div className="relative flex-1 min-w-44 max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary group-focus-within:text-accent transition-colors pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              placeholder="Search POs, items, supplier…"
              className="w-full h-8.5 pl-8.5 pr-7 text-xs rounded-lg border border-border bg-bg text-text placeholder:text-text-secondary/70 focus:border-accent/60 focus:ring-2 focus:ring-accent/15 focus:outline-hidden transition-all"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onFilterChange({ search: "" })}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-text-secondary hover:text-text hover:bg-border/60 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Status Filter Popover */}
          <div className="relative" ref={statusRef}>
            <button
              type="button"
              onClick={() => setIsStatusOpen((prev) => !prev)}
              className={cn(
                "h-8.5 px-2.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs",
                filters.status !== "all"
                  ? "bg-accent/10 border-accent/40 text-accent font-bold"
                  : "bg-bg border-border text-text-secondary hover:text-text hover:border-border-subtle"
              )}
            >
              <selectedStatusConfig.icon className="h-3.5 w-3.5" />
              <span>{filters.status === "all" ? "Status" : selectedStatusConfig.label}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {isStatusOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                {STATUS_CONFIGS.map((st) => {
                  const Icon = st.icon;
                  const isSelected = filters.status === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        onFilterChange({ status: st.id });
                        setIsStatusOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left",
                        isSelected ? "font-bold text-accent bg-accent/5" : "text-text hover:bg-bg-subtle"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", st.dotColor)} />
                        <Icon className="h-3.5 w-3.5 text-text-secondary" />
                        <span>{st.label}</span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-accent" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Item Type Filter Popover */}
          <div className="relative" ref={typeRef}>
            <button
              type="button"
              onClick={() => setIsTypeOpen((prev) => !prev)}
              className={cn(
                "h-8.5 px-2.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs",
                filters.itemType !== "all"
                  ? "bg-accent/10 border-accent/40 text-accent font-bold"
                  : "bg-bg border-border text-text-secondary hover:text-text hover:border-border-subtle"
              )}
            >
              {filters.itemType === "consumable" ? (
                <Boxes className="h-3.5 w-3.5" />
              ) : filters.itemType === "asset" ? (
                <Tag className="h-3.5 w-3.5" />
              ) : (
                <Filter className="h-3.5 w-3.5" />
              )}
              <span>
                {filters.itemType === "all"
                  ? "Type"
                  : filters.itemType === "consumable"
                  ? "Consumables"
                  : "Assets"}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {isTypeOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 bg-card border border-border rounded-xl shadow-lg z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                {(
                  [
                    { id: "all", label: "All Items", icon: Layers },
                    { id: "consumable", label: "Consumables", icon: Boxes },
                    { id: "asset", label: "Assets", icon: Tag },
                  ] as const
                ).map((t) => {
                  const Icon = t.icon;
                  const isSelected = filters.itemType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onFilterChange({ itemType: t.id });
                        setIsTypeOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors text-left",
                        isSelected ? "font-bold text-accent bg-accent/5" : "text-text hover:bg-bg-subtle"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-text-secondary" />
                        <span>{t.label}</span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-accent" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Supplier Dropdown Popover */}
          <div className="relative" ref={supplierRef}>
            <button
              type="button"
              onClick={() => setIsSupplierOpen((prev) => !prev)}
              className={cn(
                "h-8.5 px-2.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs",
                filters.supplierId
                  ? "bg-accent/10 border-accent/40 text-accent font-bold"
                  : "bg-bg border-border text-text-secondary hover:text-text hover:border-border-subtle"
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span className="max-w-28 truncate">{selectedSupplierName || "Supplier"}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {isSupplierOpen && (
              <div className="absolute top-full left-0 mt-1 w-60 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-text-secondary pointer-events-none" />
                    <input
                      type="text"
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      placeholder="Search suppliers…"
                      className="w-full h-7 pl-7 pr-2 text-xs rounded-md bg-bg border border-border text-text placeholder:text-text-secondary focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onFilterChange({ supplierId: "" });
                      setIsSupplierOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-bg-subtle transition-colors text-left",
                      !filters.supplierId ? "font-bold text-accent bg-accent/5" : "text-text"
                    )}
                  >
                    <span>All Suppliers ({supplierOptions.length})</span>
                    {!filters.supplierId && <Check className="h-3.5 w-3.5 text-accent" />}
                  </button>

                  {filteredSuppliers.map((opt) => {
                    const isSelected = filters.supplierId === opt.value;
                    return (
                      <button
                        key={opt.value || opt.label}
                        type="button"
                        onClick={() => {
                          onFilterChange({ supplierId: opt.value });
                          setIsSupplierOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-bg-subtle transition-colors text-left",
                          isSelected ? "font-bold text-accent bg-accent/5" : "text-text"
                        )}
                      >
                        <span className="truncate pr-2">{opt.label}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {opt.count !== undefined && (
                            <span className="text-[10px] text-text-secondary px-1.5 py-0.5 rounded-md bg-bg-subtle">
                              {opt.count}
                            </span>
                          )}
                          {isSelected && <Check className="h-3.5 w-3.5 text-accent" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Date Presets Popover */}
          <div className="relative" ref={dateRef}>
            <button
              type="button"
              onClick={() => setIsDateOpen((prev) => !prev)}
              className={cn(
                "h-8.5 px-2.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs",
                filters.datePreset !== "all" || filters.startDate || filters.endDate
                  ? "bg-accent/10 border-accent/40 text-accent font-bold"
                  : "bg-bg border-border text-text-secondary hover:text-text hover:border-border-subtle"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {filters.datePreset === "all"
                  ? "Date"
                  : filters.datePreset === "30d"
                  ? "30 Days"
                  : filters.datePreset === "this_month"
                  ? "This Month"
                  : filters.datePreset === "this_year"
                  ? "This Year"
                  : "Custom"}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {isDateOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-xl shadow-lg z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="grid grid-cols-2 gap-1">
                  {(
                    [
                      { id: "all", label: "All Time" },
                      { id: "30d", label: "30 Days" },
                      { id: "this_month", label: "This Month" },
                      { id: "this_year", label: "This Year" },
                    ] as const
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleDatePreset(preset.id)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-md text-left font-medium transition-colors",
                        filters.datePreset === preset.id
                          ? "bg-accent text-accent-foreground font-bold"
                          : "text-text hover:bg-bg-subtle"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-border space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                    Custom Date Range
                  </span>
                  <div className="space-y-1">
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        onFilterChange({
                          datePreset: "custom",
                          startDate: e.target.value,
                        })
                      }
                      className="w-full h-7 px-2 text-xs rounded-md bg-bg border border-border text-text focus:outline-hidden"
                    />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) =>
                        onFilterChange({
                          datePreset: "custom",
                          endDate: e.target.value,
                        })
                      }
                      className="w-full h-7 px-2 text-xs rounded-md bg-bg border border-border text-text focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Reset Button + View Switcher */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Inline Reset Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 h-8.5 px-2.5 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

          <div className="w-px h-5 bg-border mx-0.5 hidden sm:block" />

          {/* View Mode Toggle */}
          <div className="flex items-center h-8.5 rounded-lg border border-border bg-bg-subtle/80 p-0.5">
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: "table" })}
              title="Table View"
              className={cn(
                "h-7 px-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1",
                filters.viewMode === "table"
                  ? "bg-bg text-text shadow-2xs font-bold border border-border/80"
                  : "text-text-secondary hover:text-text"
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: "grid" })}
              title="Card Grid View"
              className={cn(
                "h-7 px-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1",
                filters.viewMode === "grid"
                  ? "bg-bg text-text shadow-2xs font-bold border border-border/80"
                  : "text-text-secondary hover:text-text"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
