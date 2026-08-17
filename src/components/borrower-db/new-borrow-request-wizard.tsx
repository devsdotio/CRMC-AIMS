"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Tag,
  AlertCircle,
  Check,
  CheckCircle2,
  Package,
  Briefcase,
  Clock,
  Layers,
  FileCheck2,
  FileText,
  StickyNote,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/constants/categories";
import type { BrowseItem, WizardFormValues, RequestWizardStep, PortalBorrowRequest } from "./types";
import { useCreateBorrowRequestMutation } from "@/features/borrow-requests/client/use-borrow-requests";
import { useCreateConsumableRequestMutation } from "@/features/consumable-requests/client";
import { useAssetsQuery } from "@/features/assets/client/use-assets";
import { useConsumablesQuery } from "@/features/consumables/client/use-consumables";
import { useMeQuery } from "@/features/users/client/use-users";
import type { MeProfile } from "@/features/users/client/users-api";
import { LoadingState } from "@/components/providers/loading-context";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split("T")[0];
}

function nextWeek() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

// ─── Step Indicators ─────────────────────────────────────────────────────────

const STEPS: { key: RequestWizardStep; label: string; stepNumber: number }[] = [
  { key: "type", label: "Request Type", stepNumber: 1 },
  { key: "select", label: "Select Items", stepNumber: 2 },
  { key: "details", label: "Request Details", stepNumber: 3 },
  { key: "review", label: "Review & Submit", stepNumber: 4 },
];

function MilestoneStepIndicator({ current }: { current: RequestWizardStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <nav aria-label="Request Progress" className="w-full">
      <ol className="flex items-center justify-between w-full">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isLast = idx === STEPS.length - 1;

          return (
            <li
              key={step.key}
              className={cn(
                "flex items-center",
                isLast ? "flex-none" : "flex-1"
              )}
            >
              <div className="flex items-center gap-2.5">
                {/* Milestone Node */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                    isDone
                      ? "bg-accent text-accent-foreground shadow-xs"
                      : isActive
                      ? "bg-accent text-accent-foreground ring-4 ring-accent/20 shadow-xs"
                      : "bg-bg-subtle border border-border text-text-secondary font-medium"
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span>{step.stepNumber}</span>
                  )}
                </div>

                {/* Milestone Label */}
                <div className="hidden sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Step {step.stepNumber}
                  </p>
                  <p
                    className={cn(
                      "text-xs leading-none transition-colors",
                      isActive
                        ? "font-bold text-text"
                        : isDone
                        ? "font-semibold text-text"
                        : "font-medium text-text-secondary"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>

              {/* Connecting Milestone Bar */}
              {!isLast && (
                <div
                  className={cn(
                    "mx-3 flex-1 h-0.5 transition-all duration-300 rounded-full",
                    idx < currentIdx ? "bg-accent" : "bg-border"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Step 0: Request Type (Grouped with Distinct Vibrant Colors) ─────────────

function StepType({
  value,
  onChange,
}: {
  value: "borrowable" | "assignable" | "consumable" | null;
  onChange: (type: "borrowable" | "assignable" | "consumable") => void;
}) {
  const borrowGroup = [
    {
      id: "borrowable",
      title: "Borrow Equipment",
      subtitle: "Short-term temporary loan",
      description: "Loan equipment (e.g. laptops, projectors, tools) with a scheduled return date.",
      icon: Clock,
      badge: "Return Required",
      color: "blue",
      theme: {
        iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        selectedCard: "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/30 shadow-xs",
        selectedTitle: "text-blue-600 dark:text-blue-400",
        selectedRadio: "border-blue-500 bg-blue-500 text-white",
        activeIcon: "bg-blue-600 text-white border-transparent",
      },
    },
    {
      id: "assignable",
      title: "Request Assignment",
      subtitle: "Long-term custody allocation",
      description: "Direct equipment allocation designated for personal or departmental custody.",
      icon: Briefcase,
      badge: "Custody Assignment",
      color: "indigo",
      theme: {
        iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
        selectedCard: "border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/30 shadow-xs",
        selectedTitle: "text-indigo-600 dark:text-indigo-400",
        selectedRadio: "border-indigo-500 bg-indigo-500 text-white",
        activeIcon: "bg-indigo-600 text-white border-transparent",
      },
    },
  ] as const;

  const requisitionGroup = [
    {
      id: "consumable",
      title: "Supplies Requisition",
      subtitle: "Consumables & Office Supplies",
      description: "Request consumable office stationery, printing materials, toner, or inventory supplies.",
      icon: Layers,
      badge: "Requisition",
      color: "emerald",
      theme: {
        iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        selectedCard: "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/30 shadow-xs",
        selectedTitle: "text-emerald-600 dark:text-emerald-400",
        selectedRadio: "border-emerald-500 bg-emerald-500 text-white",
        activeIcon: "bg-emerald-600 text-white border-transparent",
      },
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* ── Group 1: Borrow Request ── */}
      <section aria-labelledby="group-borrow-title" className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Package className="h-3.5 w-3.5" />
            </div>
            <h3 id="group-borrow-title" className="text-sm font-bold text-text">
              Borrow Request
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-bg-subtle px-2 py-0.5 rounded-full border border-border">
            Asset Lending & Custody
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {borrowGroup.map((opt) => {
            const isSelected = value === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={cn(
                  "flex flex-col justify-between p-4 rounded-xl border text-left transition-all duration-150 relative",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  isSelected
                    ? opt.theme.selectedCard
                    : "border-border bg-card hover:bg-bg-subtle hover:border-text-secondary/30"
                )}
              >
                <div className="flex items-start justify-between gap-3 w-full">
                  <div
                    className={cn(
                      "h-9 w-9 shrink-0 rounded-lg flex items-center justify-center border transition-colors",
                      isSelected ? opt.theme.activeIcon : opt.theme.iconBg
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors border",
                      isSelected ? opt.theme.selectedRadio : "border-border bg-card"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-3 text-white" />}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-bold", isSelected ? opt.theme.selectedTitle : "text-text")}>
                      {opt.title}
                    </p>
                  </div>
                  <p className="text-[11px] font-medium text-text-secondary mt-0.5">
                    {opt.subtitle}
                  </p>
                  <p className="text-xs text-text-secondary/80 mt-1.5 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Group 2: Requisition ── */}
      <section aria-labelledby="group-req-title" className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileCheck2 className="h-3.5 w-3.5" />
            </div>
            <h3 id="group-req-title" className="text-sm font-bold text-text">
              Requisition
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-bg-subtle px-2 py-0.5 rounded-full border border-border">
            Supplies & Materials
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {requisitionGroup.map((opt) => {
            const isSelected = value === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-150 relative",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  isSelected
                    ? opt.theme.selectedCard
                    : "border-border bg-card hover:bg-bg-subtle hover:border-text-secondary/30"
                )}
              >
                <div
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border transition-colors",
                    isSelected ? opt.theme.activeIcon : opt.theme.iconBg
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-bold", isSelected ? opt.theme.selectedTitle : "text-text")}>
                      {opt.title}
                    </p>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", opt.theme.badge)}>
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-text-secondary mt-0.5">
                    {opt.subtitle}
                  </p>
                  <p className="text-xs text-text-secondary/80 mt-1 leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                <div
                  className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-1 transition-colors border",
                    isSelected ? opt.theme.selectedRadio : "border-border bg-card"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─── Step 1: Select Item (with LoadingState & Pagination) ────────────────────

const SELECT_PAGE_SIZE = 6;

function StepSelect({
  value,
  onChange,
  initialType,
  requestType,
}: {
  value: BrowseItem[];
  onChange: (items: BrowseItem[]) => void;
  initialType?: "borrow" | "requisition" | null;
  requestType?: "borrowable" | "assignable" | "consumable" | null;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: assets = [], isLoading: assetsLoading } = useAssetsQuery();
  const { data: paginatedData, isLoading: consumablesLoading } = useConsumablesQuery();
  const consumables = useMemo(() => paginatedData?.data ?? [], [paginatedData?.data]);
  const loading = assetsLoading || consumablesLoading;

  // Reset page when search or request type changes
  useEffect(() => {
    setPage(1);
  }, [search, requestType]);

  const BROWSE_ITEMS = useMemo(() => {
    return [
      ...assets.map(a => ({
        id: a.id,
        name: a.name,
        category: a.category,
        type: "asset" as const,
        status: a.status,
        assignmentType: a.assignmentType,
        assetCode: a.assetCode,
        location: a.location,
      })),
      ...consumables.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        type: "consumable" as const,
        status: c.currentQty <= 0 ? "out_of_stock" : c.currentQty <= c.minThreshold ? "low_stock" : "available",
        itemCode: c.itemCode,
        currentQty: c.currentQty,
        unit: c.unit,
        location: c.location,
      }))
    ] as BrowseItem[];
  }, [assets, consumables]);

  const items = useMemo(() => {
    return BROWSE_ITEMS.filter((item) => {
      // 0. Filter by explicit requestType
      if (requestType === "borrowable") {
        if (item.type !== "asset") return false;
        if (item.assignmentType !== "borrowable") return false;
      }
      if (requestType === "assignable") {
        if (item.type !== "asset") return false;
        if (item.assignmentType !== "assignable") return false;
      }
      if (requestType === "consumable" && item.type !== "consumable") return false;

      // 1. Filter by requested type (legacy initialType fallback)
      if (!requestType) {
        if (initialType === "borrow" && item.type !== "asset") return false;
        if (initialType === "requisition" && item.type !== "consumable") return false;
      }

      // 2. Filter by status (available for assets, not out_of_stock for consumables)
      const isAvailable =
        item.type === "asset" ? item.status === "active" : item.status !== "out_of_stock";
      if (!isAvailable) return false;

      // 3. Filter by search term
      return item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.type === "asset" ? item.assetCode : item.itemCode).toLowerCase().includes(search.toLowerCase());
    });
  }, [BROWSE_ITEMS, requestType, initialType, search]);

  const totalPages = Math.max(1, Math.ceil(items.length / SELECT_PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * SELECT_PAGE_SIZE;
    return items.slice(start, start + SELECT_PAGE_SIZE);
  }, [items, page]);

  const renderItem = (item: BrowseItem) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoryMeta = getCategoryStyle(item.category as any);
    const code = item.type === "asset" ? item.assetCode : item.itemCode;
    const isSelected = value.some(v => v.id === item.id);
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          if (isSelected) {
            onChange(value.filter(v => v.id !== item.id));
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange([...value, item as any]);
          }
        }}
        className={cn(
          "w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
          isSelected ? "bg-accent/10" : "hover:bg-bg-subtle"
        )}
        aria-pressed={isSelected}
      >
        <div
          className={cn(
            "flex items-center justify-center w-4.5 h-4.5 rounded-md border transition-all shrink-0",
            isSelected
              ? "bg-accent border-accent text-accent-foreground"
              : "border-border bg-card"
          )}
        >
          {isSelected && <Check className="h-3 w-3 stroke-3" />}
        </div>
        <div
          className={cn("h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border", categoryMeta.bg, "border-transparent")}
        >
          <Tag className={cn("h-3.5 w-3.5", categoryMeta.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text truncate">{item.name}</p>
          <p className="text-xs text-text-secondary font-mono">
            {code} · <span className="capitalize">{categoryMeta.label}</span>
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Search Bar */}
      <div className="relative shrink-0">
        <label htmlFor="search-items" className="sr-only">Search items</label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden />
        <input
          id="search-items"
          type="search"
          placeholder="Search items by name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-text placeholder:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      {/* Item List Container */}
      <div className="flex-1 min-h-65 overflow-y-auto rounded-xl border border-border bg-card flex flex-col justify-between">
        {loading ? (
          <LoadingState
            variant="inline"
            icon="package"
            message="Loading available items..."
            subtitle="Fetching latest inventory records..."
            className="py-12"
          />
        ) : items.length === 0 ? (
          <div className="p-8 text-center my-auto">
            <Package className="h-8 w-8 text-text-secondary/50 mx-auto mb-2" />
            <p className="text-sm font-semibold text-text">No items found</p>
            <p className="text-xs text-text-secondary mt-0.5">Try searching with a different term or change request type.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {paginatedItems.map(renderItem)}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && items.length > 0 && (
        <div className="flex items-center justify-between px-1 shrink-0 text-xs text-text-secondary">
          <p>
            Showing <span className="font-semibold text-text">{(page - 1) * SELECT_PAGE_SIZE + 1}</span> to{" "}
            <span className="font-semibold text-text">{Math.min(page * SELECT_PAGE_SIZE, items.length)}</span> of{" "}
            <span className="font-semibold text-text">{items.length}</span> items
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border text-xs font-semibold text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="px-2 font-medium">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border text-xs font-semibold text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Request Details (1 Row for Dates & Quantity + Upgraded UI/UX) ──

function StepDetails({
  items,
  values,
  onChange,
  errors,
}: {
  items: BrowseItem[];
  values: Omit<WizardFormValues, "selectedItems">;
  onChange: (patch: Partial<Omit<WizardFormValues, "selectedItems">>) => void;
  errors: Record<string, string>;
}) {
  const hasAsset = items.some(i => i.type === "asset");
  const isTemporaryLoan = hasAsset && values.requestType !== "assignable";

  // Primary/single item quantity handler for unified 1-row control
  const primaryItem = items[0];
  const primaryQty = primaryItem ? values.quantities[primaryItem.id] || 1 : 1;
  const maxPrimaryQty = primaryItem && primaryItem.type === "consumable" ? primaryItem.currentQty : undefined;

  const setPrimaryQty = useCallback((qty: number) => {
    if (!primaryItem) return;
    const clamped = Math.max(1, maxPrimaryQty ? Math.min(maxPrimaryQty, qty) : qty);
    onChange({ quantities: { ...values.quantities, [primaryItem.id]: clamped } });
  }, [primaryItem, maxPrimaryQty, values.quantities, onChange]);

  return (
    <div className="space-y-4">
      {/* ── Selected Items Summary Card ── */}
      <section aria-label="Selected Items" className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="bg-bg-subtle/70 px-3.5 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-text">
              Selected Item{items.length > 1 ? `s (${items.length})` : ""}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-text-secondary">
            {values.requestType === "consumable" ? "Supplies Requisition" : values.requestType === "assignable" ? "Assignment Request" : "Borrow Loan"}
          </span>
        </div>

        <div className="divide-y divide-border max-h-36 overflow-y-auto">
          {items.map((item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const catMeta = getCategoryStyle(item.category as any);
            const itemQty = values.quantities[item.id] || 1;
            const maxItemQty = item.type === "consumable" ? item.currentQty : undefined;

            return (
              <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-bg-subtle/30 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={cn("h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border", catMeta.bg, "border-transparent")}>
                    <Tag className={cn("h-4 w-4", catMeta.text)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-text truncate">{item.name}</p>
                    <p className="text-[11px] text-text-secondary font-mono">
                      {item.type === "asset" ? item.assetCode : item.itemCode} · <span className="capitalize">{catMeta.label}</span>
                    </p>
                  </div>
                </div>

                {/* Multi-item inline quantity control if more than 1 item */}
                {items.length > 1 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-text-secondary font-semibold">Qty:</span>
                    <div className="flex items-center rounded-lg border border-border bg-bg-subtle p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const newQ = Math.max(1, itemQty - 1);
                          onChange({ quantities: { ...values.quantities, [item.id]: newQ } });
                        }}
                        disabled={itemQty <= 1}
                        className="h-6 w-6 rounded-md flex items-center justify-center text-text-secondary hover:text-text hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-text">
                        {itemQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newQ = maxItemQty ? Math.min(maxItemQty, itemQty + 1) : itemQty + 1;
                          onChange({ quantities: { ...values.quantities, [item.id]: newQ } });
                        }}
                        disabled={maxItemQty ? itemQty >= maxItemQty : false}
                        className="h-6 w-6 rounded-md flex items-center justify-center text-text-secondary hover:text-text hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 1 ROW FOR DATE AND QUANTITY (Responsive Grid) ── */}
      <section aria-label="Schedule and Quantity" className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-3.5 w-3.5 text-accent" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-text">
            Schedule & Quantity Parameters
          </p>
        </div>

        <div
          className={cn(
            "grid gap-3",
            isTemporaryLoan
              ? "grid-cols-1 sm:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2"
          )}
        >
          {/* Column 1: Date From / Date Needed */}
          <div className="space-y-1.5">
            <label htmlFor="dateFrom" className="flex items-center justify-between text-xs font-bold text-text">
              <span>{!hasAsset ? "Date Needed" : "Checkout Date"}</span>
              <span className="text-status-outofservice-bg">*</span>
            </label>
            <div className="relative">
              <input
                id="dateFrom"
                type="date"
                value={values.dateFrom}
                min={today()}
                onChange={(e) => onChange({ dateFrom: e.target.value })}
                className={cn(
                  "w-full h-10 rounded-xl border bg-bg-subtle/50 px-3 text-sm font-medium text-text transition-all",
                  "focus:outline-none focus:bg-card focus:border-accent focus:ring-2 focus:ring-accent/20",
                  errors.dateFrom ? "border-status-outofservice-bg bg-status-outofservice-bg/5" : "border-border"
                )}
                aria-describedby={errors.dateFrom ? "date-from-err" : undefined}
              />
            </div>
            {errors.dateFrom && (
              <p id="date-from-err" className="text-[11px] font-medium text-status-outofservice-bg flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.dateFrom}
              </p>
            )}
          </div>

          {/* Column 2: Expected Return Date (Only for temporary asset loans) */}
          {isTemporaryLoan && (
            <div className="space-y-1.5">
              <label htmlFor="dateTo" className="flex items-center justify-between text-xs font-bold text-text">
                <span>Expected Return</span>
                <span className="text-status-outofservice-bg">*</span>
              </label>
              <div className="relative">
                <input
                  id="dateTo"
                  type="date"
                  value={values.dateTo}
                  min={values.dateFrom || today()}
                  onChange={(e) => onChange({ dateTo: e.target.value })}
                  className={cn(
                    "w-full h-10 rounded-xl border bg-bg-subtle/50 px-3 text-sm font-medium text-text transition-all",
                    "focus:outline-none focus:bg-card focus:border-accent focus:ring-2 focus:ring-accent/20",
                    errors.dateTo ? "border-status-outofservice-bg bg-status-outofservice-bg/5" : "border-border"
                  )}
                  aria-describedby={errors.dateTo ? "date-to-err" : undefined}
                />
              </div>
              {errors.dateTo && (
                <p id="date-to-err" className="text-[11px] font-medium text-status-outofservice-bg flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.dateTo}
                </p>
              )}
            </div>
          )}

          {/* Column 3: Quantity Input / Stepper */}
          <div className="space-y-1.5">
            <label htmlFor="primary-qty" className="flex items-center justify-between text-xs font-bold text-text">
              <span>Quantity</span>
              <span className="text-status-outofservice-bg">*</span>
            </label>

            {items.length <= 1 ? (
              <div className="flex items-center h-10 rounded-xl border border-border bg-bg-subtle/50 p-1 transition-all focus-within:bg-card focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                <button
                  type="button"
                  onClick={() => setPrimaryQty(primaryQty - 1)}
                  disabled={primaryQty <= 1}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  id="primary-qty"
                  type="number"
                  min={1}
                  max={maxPrimaryQty}
                  value={primaryQty}
                  onChange={(e) => setPrimaryQty(Number(e.target.value))}
                  className="w-full text-center bg-transparent text-sm font-bold text-text focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setPrimaryQty(primaryQty + 1)}
                  disabled={maxPrimaryQty ? primaryQty >= maxPrimaryQty : false}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="h-10 rounded-xl border border-border bg-bg-subtle/30 px-3 flex items-center justify-between text-xs text-text-secondary">
                <span>Total Items</span>
                <span className="font-bold text-text bg-card px-2 py-0.5 rounded-md border border-border">
                  {Object.values(values.quantities).reduce((a, b) => a + b, 0) || items.length} units
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Purpose Input Card ── */}
      <section aria-label="Purpose" className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-accent" />
            <label htmlFor="purpose" className="text-[11px] font-bold uppercase tracking-wider text-text">
              Purpose / Justification <span className="text-status-outofservice-bg">*</span>
            </label>
          </div>
          <span className="text-[10px] text-text-secondary font-medium">Required for approval</span>
        </div>

        <textarea
          id="purpose"
          value={values.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={3}
          placeholder="Briefly state the reason, project name, or clinical task for this request…"
          className={cn(
            "w-full rounded-xl border bg-bg-subtle/50 p-3 text-sm text-text placeholder:text-text-secondary transition-all resize-none",
            "focus:outline-none focus:bg-card focus:border-accent focus:ring-2 focus:ring-accent/20",
            errors.purpose ? "border-status-outofservice-bg bg-status-outofservice-bg/5" : "border-border"
          )}
          aria-describedby={errors.purpose ? "purpose-err" : undefined}
        />
        {errors.purpose && (
          <p id="purpose-err" className="text-[11px] font-medium text-status-outofservice-bg flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {errors.purpose}
          </p>
        )}
      </section>

      {/* ── Additional Notes Input Card ── */}
      <section aria-label="Additional Notes" className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <StickyNote className="h-3.5 w-3.5 text-text-secondary" />
          <label htmlFor="notes" className="text-[11px] font-bold uppercase tracking-wider text-text">
            Additional Notes <span className="text-text-secondary font-normal normal-case">(optional)</span>
          </label>
        </div>

        <textarea
          id="notes"
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={2}
          placeholder="Specify any special delivery instructions, accessories, or condition notes…"
          className="w-full rounded-xl border border-border bg-bg-subtle/50 p-3 text-sm text-text placeholder:text-text-secondary transition-all resize-none focus:outline-none focus:bg-card focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </section>
    </div>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

function StepReview({ values, me }: { values: WizardFormValues, me?: MeProfile }) {
  const { selectedItems } = values;
  if (!selectedItems || selectedItems.length === 0) return null;

  // Use the actual logged-in user or fallback to mock
  const requester = {
    name: me?.name || "Your name",
    email: me?.email || "Your email",
    department: me?.department || "Unspecified",
  };
  
  const hasAsset = selectedItems.some(i => i.type === "asset");

  const requestTypeLabel =
    values.requestType === "borrowable"
      ? "Borrow Request (Short-Term Loan)"
      : values.requestType === "assignable"
      ? "Assignment Request (Long-Term Custody)"
      : "Supplies Requisition";

  const classificationColor =
    values.requestType === "borrowable"
      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
      : values.requestType === "assignable"
      ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";

  return (
    <div className="space-y-5">
      {/* ── Request Type Header Badge ── */}
      <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-bg-subtle">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Request Classification</p>
          <p className="text-sm font-bold text-text mt-0.5">{requestTypeLabel}</p>
        </div>
        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-md border", classificationColor)}>
          {values.requestType === "consumable" ? "Requisition" : "Borrow Request"}
        </span>
      </div>

      {/* ── Requester Details ────────────────────────────────────────────── */}
      <section aria-labelledby="requester-details-heading" className="space-y-2">
        <h3 id="requester-details-heading" className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">
          Requesting department
        </h3>
        <div className="rounded-lg border border-border bg-card p-3 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Department account</p>
            <p className="font-medium text-text mt-0.5">{requester.name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Department</p>
            <p className="font-medium text-text mt-0.5">{requester.department}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Email Address</p>
            <p className="font-medium text-text mt-0.5">{requester.email}</p>
          </div>
        </div>
      </section>

      {/* ── Request Details ──────────────────────────────────────────────── */}
      <section aria-labelledby="request-details-heading" className="space-y-2">
        <h3 id="request-details-heading" className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">
          Requested Items
        </h3>
        <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
          {selectedItems.map((item) => {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const categoryMeta = getCategoryStyle(item.category as any);
             return (
               <div key={item.id} className="px-3 py-2.5 flex items-center gap-3 bg-bg-subtle/30">
                 <div className={cn("h-8 w-8 shrink-0 rounded-md flex items-center justify-center border", categoryMeta.bg, "border-transparent")}>
                   <Tag className={cn("h-4 w-4", categoryMeta.text)} />
                 </div>
                 <div className="flex-1">
                   <p className="text-sm font-medium text-text">{item.name}</p>
                   <p className="text-[10px] text-text-secondary font-mono mt-0.5 uppercase tracking-wide">
                     {item.type === "asset" ? item.assetCode : item.itemCode}
                     {" · "}
                     {categoryMeta.label}
                   </p>
                 </div>
                 <div className="text-right px-2">
                   <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Qty</p>
                   <p className="font-medium text-text">{values.quantities[item.id] || 1}</p>
                 </div>
               </div>
             )
          })}

          {/* Dates & Qty */}
          <div className="px-3 py-3 grid grid-cols-2 gap-y-3 gap-x-4 text-sm bg-card">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">{!hasAsset ? "Date Needed" : "Checkout Date"}</p>
              <p className="font-medium text-text mt-0.5">{values.dateFrom}</p>
            </div>
            {hasAsset && values.requestType !== "assignable" && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Expected Return</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-status-outofservice-bg" />
                  <p className="font-medium text-status-outofservice-bg">{values.dateTo}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Additional Details ─────────────────────────────────────────── */}
      <section aria-label="Request purpose">
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">Purpose</p>
          <p className="text-sm font-medium text-text mt-0.5">
            {values.purpose}
          </p>
        </div>
      </section>

      {/* ── Notes ──────────────────────────────────────────────────────── */}
      {values.notes && (
        <section aria-label="Additional notes">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary mb-1">Notes</p>
            <p className="text-sm text-text">{values.notes}</p>
          </div>
        </section>
      )}

      <p className="text-xs text-text-secondary text-center max-w-sm mx-auto">
        By submitting, your request will be sent to the Property Custodian / Department Head for review.
      </p>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

interface NewBorrowRequestWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledItems?: BrowseItem[];
  initialType?: "borrow" | "requisition" | null;
  onSuccess: (newRequest: PortalBorrowRequest) => void;
}

export function NewBorrowRequestWizard({
  open,
  onOpenChange,
  prefilledItems,
  initialType,
  onSuccess,
}: NewBorrowRequestWizardProps) {
  const [step, setStep] = useState<RequestWizardStep>(
    prefilledItems && prefilledItems.length > 0 ? "details" : "type"
  );
  const [values, setValues] = useState<WizardFormValues>({
    requestType: initialType === "requisition" ? "consumable" : initialType === "borrow" ? "borrowable" : null,
    selectedItems: prefilledItems ?? [],
    dateFrom: today(),
    dateTo: nextWeek(),
    quantities: {},
    purpose: "",
    notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  const { mutateAsync: createRequest, isPending: isSubmittingAsset, isSuccess: isSubmittedAsset, reset: resetAsset } = useCreateBorrowRequestMutation();
  const { mutateAsync: createConsumableRequest, isPending: isSubmittingSupply, isSuccess: isSubmittedSupply, reset: resetSupply } = useCreateConsumableRequestMutation();
  const isSubmitting = isSubmittingAsset || isSubmittingSupply;
  const isSubmitted = isSubmittedAsset || isSubmittedSupply;
  const resetMutation = useCallback(() => {
    resetAsset();
    resetSupply();
  }, [resetAsset, resetSupply]);
  const { data: me } = useMeQuery();

  useEffect(() => {
    if (!open) return;
    setStep(prefilledItems && prefilledItems.length > 0 ? "details" : "type");
    setValues({
      requestType: initialType === "requisition" ? "consumable" : initialType === "borrow" ? "borrowable" : null,
      selectedItems: prefilledItems ?? [],
      dateFrom: today(),
      dateTo: nextWeek(),
      quantities: {},
      purpose: "",
      notes: "",
    });
    setFieldErrors({});
    setErrorMessage("");
    resetMutation();
  }, [open, prefilledItems, resetMutation, initialType]);

  const patchValues = useCallback(
    (patch: Partial<WizardFormValues>) => setValues((p) => ({ ...p, ...patch })),
    []
  );

  const canAdvanceSelect = values.selectedItems.length > 0;
  const canAdvanceType = values.requestType !== null;

  function validateDetails(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!values.dateFrom) errs.dateFrom = "Start date is required.";
    const hasAsset = values.selectedItems.some(i => i.type === "asset");
    if (hasAsset && values.requestType !== "assignable") {
      if (!values.dateTo) errs.dateTo = "End date is required.";
      else if (values.dateTo < values.dateFrom) errs.dateTo = "End date must be on or after start date.";
    }
    if (!values.purpose.trim()) errs.purpose = "Purpose is required.";
    values.selectedItems.forEach((item) => {
      const q = values.quantities[item.id] || 1;
      if (q < 1) errs[`qty_${item.id}`] = "Quantity must be at least 1.";
    });
    return errs;
  }

  function handleNext() {
    if (step === "type") {
      if (!canAdvanceType) return;
      setStep("select");
    } else if (step === "select") {
      if (!canAdvanceSelect) return;
      setStep("details");
    } else if (step === "details") {
      const errs = validateDetails();
      setFieldErrors(errs);
      if (Object.keys(errs).length === 0) setStep("review");
    }
  }

  function handleBack() {
    if (step === "select") setStep("type");
    if (step === "details") setStep(prefilledItems && prefilledItems.length > 0 ? "type" : "select");
    if (step === "review") setStep("details");
    setErrorMessage("");
  }

  async function handleSubmit() {
    setErrorMessage("");

    try {
      const items = values.selectedItems.map(item => ({
        itemDescription: item.name,
        assetId: item.type === "asset" ? item.id : undefined,
        assetCode: item.type === "asset" ? item.assetCode : undefined,
        consumableId: item.type === "consumable" ? item.id : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: item.category as any,
        quantity: values.quantities[item.id] || 1,
        itemType: item.type,
      }));

      if (!me?.id || !me.email) {
        setErrorMessage("Your profile could not be loaded. Sign in again and retry.");
        return;
      }
      if (!me.departmentId) {
        setErrorMessage(
          "This login is not linked to a department. Ask an administrator to assign one."
        );
        return;
      }

      const hasAsset = items.some((item) => item.itemType === "asset");

      if (values.requestType === "consumable") {
        const created = await createConsumableRequest({
          requesterUserId: me.id,
          requesterName: me.name,
          requesterEmail: me.email,
          departmentId: me.departmentId,
          purpose: values.purpose,
          notes: values.notes || undefined,
          lines: items
            .filter((item) => item.consumableId)
            .map((item) => ({
              consumableId: item.consumableId!,
              quantity: item.quantity,
            })),
        });
        onSuccess({
          id: created.id,
          requestCode: created.requestCode,
          requesterName: created.requesterName,
          requesterEmail: created.requesterEmail,
          requesterPhone: created.requesterPhone,
          department: created.department,
          items: created.lines.map((line) => ({
            itemDescription: line.itemName,
            consumableId: line.consumableId,
            category: line.category,
            quantity: line.quantityRequested,
            itemType: "consumable" as const,
          })),
          purpose: created.purpose,
          requestedAt: created.requestedAt,
          expectedReturnDate: null,
          status: created.status,
          notes: created.notes,
          history: created.history.map((h) => ({
            id: h.id,
            action: h.action === "submitted" ? "submitted" : h.action,
            actor: h.actor,
            timestamp: h.timestamp,
            note: h.note,
          })),
          requestedDateFrom: created.requestedAt.slice(0, 10),
          requestedDateTo: created.requestedAt.slice(0, 10),
        });
        onOpenChange(false);
        return;
      }

      const createdRequest = await createRequest({
        requesterUserId: me.id,
        requesterName: me.name,
        requesterEmail: me.email,
        departmentId: me.departmentId,
        requestType:
          values.requestType === "assignable"
            ? "assignable"
            : values.requestType === "borrowable"
              ? "borrowable"
              : undefined,
        items: items
          .filter((item) => item.itemType === "asset")
          .map((item) => ({
            itemDescription: item.itemDescription,
            assetId: item.assetId,
            assetCode: item.assetCode,
            category: item.category,
            quantity: item.quantity,
            itemType: "asset" as const,
          })),
        purpose: values.purpose,
        expectedReturnDate:
          hasAsset && values.requestType !== "assignable"
            ? values.dateTo
            : undefined,
        notes: values.notes || undefined,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSuccess(createdRequest as any);
      onOpenChange(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to submit request.");
    }
  }

  if (!open) return null;

  const headerTitle =
    values.requestType === "consumable" || initialType === "requisition"
      ? "New Requisition Request"
      : values.requestType === "borrowable" || values.requestType === "assignable" || initialType === "borrow"
      ? "New Borrow Request"
      : "New Requests";

  const categoryBadgeLabel =
    values.requestType === "consumable"
      ? "Requisition"
      : values.requestType === "borrowable" || values.requestType === "assignable"
      ? "Borrow Request"
      : "Portal";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isSubmitting && onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-3xl h-170 max-h-[92vh] rounded-xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header with Milestone Stepper */}
        <div className="px-6 py-4.5 border-b border-border bg-card shrink-0 space-y-3.5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="wizard-title" className="text-base font-bold text-text">
                  {headerTitle}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  {categoryBadgeLabel}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Complete the milestones below to submit your request for custodian review.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              aria-label="Close wizard"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Milestone Stepper */}
          <div className="pt-1">
            <MilestoneStepIndicator current={step} />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "type" && (
            <StepType
              value={values.requestType}
              onChange={(type) => {
                patchValues({ requestType: type, selectedItems: [] }); // Reset items if type changes
              }}
            />
          )}
          {step === "select" && (
            <StepSelect
              value={values.selectedItems}
              onChange={(items) => patchValues({ selectedItems: items })}
              initialType={initialType}
              requestType={values.requestType}
            />
          )}
          {step === "details" && values.selectedItems.length > 0 && (
            <StepDetails
              items={values.selectedItems}
              values={{ requestType: values.requestType, dateFrom: values.dateFrom, dateTo: values.dateTo, quantities: values.quantities, purpose: values.purpose, notes: values.notes }}
              onChange={patchValues}
              errors={fieldErrors}
            />
          )}
          {step === "review" && (
            <>
              <StepReview values={values} me={me} />
              {errorMessage && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-status-outofservice-bg/10 border border-status-outofservice-bg/30 p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-status-outofservice-bg mt-0.5" />
                  <p className="text-xs text-status-outofservice-bg dark:text-status-outofservice-text">{errorMessage}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-card shrink-0">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === "type" || isSubmitting || isSubmitted || (step === "details" && prefilledItems && prefilledItems.length > 0)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-border text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {step !== "review" ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={(step === "type" && !canAdvanceType) || (step === "select" && !canAdvanceSelect)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent shadow-xs"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isSubmitted}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                  Submitting…
                </>
              ) : isSubmitted ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submitted!
                </>
              ) : (
                "Submit Request"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
