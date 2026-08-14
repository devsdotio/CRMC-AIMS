"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Calendar,
  FileText,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Tag,
  AlertCircle,
  CheckCircle2,
  Package,
  ListFilter,
  Briefcase,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/constants/categories";
import type { BrowseItem, WizardFormValues, RequestWizardStep, PortalBorrowRequest } from "./types";
import { useCreateBorrowRequestMutation } from "@/features/borrow-requests/client/use-borrow-requests";
import { useAssetsQuery } from "@/features/assets/client/use-assets";
import { useConsumablesQuery } from "@/features/consumables/client/use-consumables";
import { useMeQuery } from "@/features/users/client/use-users";
import type { MeProfile } from "@/features/users/client/users-api";

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

const STEPS: { key: RequestWizardStep; label: string; Icon: React.ElementType }[] = [
  { key: "type", label: "Request Type", Icon: ListFilter },
  { key: "select", label: "Select Item", Icon: Package },
  { key: "details", label: "Request Details", Icon: Calendar },
  { key: "review", label: "Review & Submit", Icon: FileText },
];

function StepIndicator({ current }: { current: RequestWizardStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-0" role="list" aria-label="Wizard steps">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        const Icon = step.Icon;
        return (
          <div key={step.key} role="listitem" className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : isDone
                  ? "bg-status-active-bg/20 text-status-active-text"
                  : "bg-bg-subtle text-text-secondary"
              )}
              aria-current={isActive ? "step" : undefined}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {step.label}
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 mx-1 transition-colors",
                  idx < currentIdx ? "bg-status-active-bg" : "bg-border"
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 0: Request Type ───────────────────────────────────────────────────

function StepType({
  value,
  onChange,
}: {
  value: "borrowable" | "assignable" | "consumable" | null;
  onChange: (type: "borrowable" | "assignable" | "consumable") => void;
}) {
  const options = [
    {
      id: "borrowable",
      title: "Borrow Equipment",
      description: "Short-term loan of assets (e.g., projectors, laptops).",
      icon: Clock,
    },
    {
      id: "assignable",
      title: "Request Assignment",
      description: "Long-term assignment of an asset to you.",
      icon: Briefcase,
    },
    {
      id: "consumable",
      title: "Request Supplies",
      description: "Request consumable items (e.g., pens, paper).",
      icon: Zap,
    },
  ] as const;

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const isSelected = value === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isSelected
                ? "border-accent bg-accent/5 ring-1 ring-accent"
                : "border-border bg-card hover:bg-bg-subtle hover:border-text-secondary/30"
            )}
          >
            <div className={cn(
              "h-9 w-9 shrink-0 rounded-md flex items-center justify-center border transition-colors",
              isSelected ? "bg-accent border-transparent text-accent-foreground" : "bg-bg-subtle border-border text-text-secondary"
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className={cn("text-sm font-semibold", isSelected ? "text-accent" : "text-text")}>
                {opt.title}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">{opt.description}</p>
            </div>
            <div className={cn(
              "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-2",
              isSelected ? "border-accent" : "border-border"
            )}>
              {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-accent" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step 1: Select Item ─────────────────────────────────────────────────────

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
  const { data: assets = [], isLoading: assetsLoading } = useAssetsQuery();
  const { data: paginatedData, isLoading: consumablesLoading } = useConsumablesQuery();
  const consumables = useMemo(() => paginatedData?.data ?? [], [paginatedData?.data]);

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

  const items = BROWSE_ITEMS.filter((item) => {
    // 0. Filter by explicit requestType
    if (requestType === "borrowable" && item.type !== "asset") return false;
    if (requestType === "assignable" && item.type !== "asset") return false;
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
    return item.name.toLowerCase().includes(search.toLowerCase());
  });

  const assetItems = items.filter(i => i.type === "asset");
  const consumableItems = items.filter(i => i.type === "consumable");

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
          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
          isSelected ? "bg-accent/5" : "hover:bg-bg-subtle"
        )}
        aria-pressed={isSelected}
      >
        <div
          className={cn(
            "flex items-center justify-center w-4 h-4 rounded-sm border transition-colors shrink-0",
            isSelected ? "bg-accent border-accent text-accent-foreground" : "border-border bg-card"
          )}
        >
          {isSelected && <CheckCircle2 className="h-3 w-3" />}
        </div>
        <div
          className={cn("h-7 w-7 shrink-0 rounded-md flex items-center justify-center border", categoryMeta.bg, "border-transparent")}
        >
          <Tag className={cn("h-3 w-3", categoryMeta.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text truncate">{item.name}</p>
          <p className="text-xs text-text-secondary font-mono">{code}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="relative shrink-0">
        <label htmlFor="search-items" className="sr-only">Search items</label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden />
        <input
          id="search-items"
          type="search"
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-8 rounded-md border border-border bg-bg-subtle pl-8 pr-3 text-sm text-text placeholder:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border">
        {assetsLoading || consumablesLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : items.length === 0 ? (
          <p className="p-4 text-xs text-center text-text-secondary">No items match your search.</p>
        ) : (
          <div className="divide-y divide-border">
            {assetItems.length > 0 && (
              <div>
                <div className="sticky top-0 bg-bg-subtle/95 backdrop-blur px-3 py-1.5 border-b border-border z-10">
                  <p className="text-xs font-semibold text-text uppercase tracking-wider">Assets</p>
                </div>
                <div className="divide-y divide-border">
                  {assetItems.map(renderItem)}
                </div>
              </div>
            )}
            {consumableItems.length > 0 && (
              <div>
                <div className="sticky top-0 bg-bg-subtle/95 backdrop-blur px-3 py-1.5 border-b border-border z-10">
                  <p className="text-xs font-semibold text-text uppercase tracking-wider">Consumables</p>
                </div>
                <div className="divide-y divide-border">
                  {consumableItems.map(renderItem)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Request Details ──────────────────────────────────────────────────

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
  const hasConsumable = items.some(i => i.type === "consumable");
  const hasAsset = items.some(i => i.type === "asset");

  return (
    <div className="space-y-4">
      {/* Selected item reminder */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 rounded-lg bg-bg-subtle border border-border px-3 py-2">
            <div
              className={cn(
                "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                getCategoryStyle(item.category as any).bg
              )}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tag className={cn("h-3.5 w-3.5", getCategoryStyle(item.category as any).text)} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">{item.name}</p>
              <p className="text-xs text-text-secondary font-mono">
                {item.type === "asset" ? item.assetCode : item.itemCode}
              </p>
            </div>
            <div className="space-y-1 shrink-0">
              <label htmlFor={`qty_${item.id}`} className="sr-only">Quantity for {item.name}</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Qty:</span>
                <input
                  id={`qty_${item.id}`}
                  type="number"
                  min={1}
                  max={item.type === "consumable" ? item.currentQty : undefined}
                  value={values.quantities[item.id] || 1}
                  onChange={(e) => {
                    const newQ = { ...values.quantities, [item.id]: Math.max(1, Number(e.target.value)) };
                    onChange({ quantities: newQ });
                  }}
                  className={cn(
                    "w-16 h-7 rounded-md border bg-card px-2 text-xs text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    errors[`qty_${item.id}`] ? "border-status-outofservice-bg" : "border-border"
                  )}
                />
              </div>
              {errors[`qty_${item.id}`] && (
                <p className="text-[10px] text-status-outofservice-bg">{errors[`qty_${item.id}`]}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Date range */}
      <div className={cn("grid gap-3", hasAsset ? "grid-cols-2" : "grid-cols-1")}>
        <div className="space-y-1">
          <label htmlFor="dateFrom" className="block text-xs font-semibold text-text uppercase tracking-wider">
            {!hasAsset ? "Date Needed" : "Date From"} <span className="text-status-outofservice-bg">*</span>
          </label>
          <input
            id="dateFrom"
            type="date"
            value={values.dateFrom}
            min={today()}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
            className={cn(
              "w-full h-8 rounded-md border bg-card px-2.5 text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              errors.dateFrom ? "border-status-outofservice-bg" : "border-border"
            )}
            aria-describedby={errors.dateFrom ? "date-from-err" : undefined}
          />
          {errors.dateFrom && (
            <p id="date-from-err" className="text-xs text-status-outofservice-bg">{errors.dateFrom}</p>
          )}
        </div>
        {hasAsset && (
          <div className="space-y-1">
            <label htmlFor="dateTo" className="block text-xs font-semibold text-text uppercase tracking-wider">
              Date To <span className="text-status-outofservice-bg">*</span>
            </label>
            <input
              id="dateTo"
              type="date"
              value={values.dateTo}
              min={values.dateFrom || today()}
              onChange={(e) => onChange({ dateTo: e.target.value })}
              className={cn(
                "w-full h-8 rounded-md border bg-card px-2.5 text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                errors.dateTo ? "border-status-outofservice-bg" : "border-border"
              )}
              aria-describedby={errors.dateTo ? "date-to-err" : undefined}
            />
            {errors.dateTo && (
              <p id="date-to-err" className="text-xs text-status-outofservice-bg">{errors.dateTo}</p>
            )}
          </div>
        )}
      </div>

      {/* Purpose */}
      <div className="space-y-1">
        <label htmlFor="purpose" className="block text-xs font-semibold text-text uppercase tracking-wider">
          Purpose / Reason <span className="text-status-outofservice-bg">*</span>
        </label>
        <textarea
          id="purpose"
          value={values.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={3}
          placeholder="Briefly describe why you need to borrow this item…"
          className={cn(
            "w-full rounded-md border bg-card px-3 py-2 text-sm text-text placeholder:text-text-secondary resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            errors.purpose ? "border-status-outofservice-bg" : "border-border"
          )}
          aria-describedby={errors.purpose ? "purpose-err" : undefined}
        />
        {errors.purpose && (
          <p id="purpose-err" className="text-xs text-status-outofservice-bg">{errors.purpose}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label htmlFor="notes" className="block text-xs font-semibold text-text uppercase tracking-wider">
          Additional Notes <span className="text-text-secondary font-normal normal-case">(optional)</span>
        </label>
        <textarea
          id="notes"
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={2}
          placeholder="Any special requirements?"
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-secondary resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>
    </div>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

function StepReview({ values, me }: { values: WizardFormValues, me?: MeProfile }) {
  const { selectedItems } = values;
  if (!selectedItems || selectedItems.length === 0) return null;

  // Use the actual logged-in user or fallback to mock
  const requester = {
    name: me?.name || "Maria Santos",
    email: me?.email || "m.santos@aims.org",
    department: me?.department || "IT",
  };
  
  const hasAsset = selectedItems.some(i => i.type === "asset");

  return (
    <div className="space-y-6">
      {/* ── Requester Details ────────────────────────────────────────────── */}
      <section aria-labelledby="requester-details-heading" className="space-y-2">
        <h3 id="requester-details-heading" className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">
          Requester Details
        </h3>
        <div className="rounded-lg border border-border bg-card p-3 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Name</p>
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
          Request Details
        </h3>
        <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
          {selectedItems.map((item, idx) => {
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
        By submitting, your request will be sent to the Property Custodian for review.
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

  const { mutateAsync: createRequest, isPending: isSubmitting, isSuccess: isSubmitted, reset: resetMutation } = useCreateBorrowRequestMutation();
  const { data: me } = useMeQuery();

  useEffect(() => {
    if (open) {
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
    }
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: item.category as any,
        quantity: values.quantities[item.id] || 1,
        itemType: item.type,
      }));

      const createdRequest = await createRequest({
        requesterUserId: me?.id,
        requesterName: me?.name || "Maria Santos",
        requesterEmail: me?.email || "m.santos@aims.org",
        department: me?.department || "IT",
        items,
        purpose: values.purpose,
        expectedReturnDate: values.dateTo,
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
      <div className="relative z-10 w-full max-w-3xl h-162.5 rounded-xl bg-card border border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border shrink-0">
          <div>
            <h2 id="wizard-title" className="text-base font-bold text-text">
              {initialType === "requisition" || values.selectedItems.some(i => i.type === "consumable") ? "New Supplies Request" : "New Borrow Request"}
            </h2>
            <div className="mt-2">
              <StepIndicator current={step} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            aria-label="Close wizard"
            className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
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
        <div className="flex items-center justify-between gap-3 p-5 border-t border-border shrink-0">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isSubmitted}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
