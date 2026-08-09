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

// ─── Step 1: Select Item ─────────────────────────────────────────────────────

function StepSelect({
  value,
  onChange,
  initialType,
}: {
  value: BrowseItem | null;
  onChange: (item: BrowseItem) => void;
  initialType?: "borrow" | "requisition" | null;
}) {
  const [search, setSearch] = useState("");
  const { data: assets = [], isLoading: assetsLoading } = useAssetsQuery();
  const { data: consumables = [], isLoading: consumablesLoading } = useConsumablesQuery();

  const BROWSE_ITEMS = useMemo(() => {
    return [
      ...assets.map(a => ({
        id: a.id,
        name: a.name,
        category: a.category,
        type: "asset" as const,
        status: a.status,
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
    // 1. Filter by requested type
    if (initialType === "borrow" && item.type !== "asset") return false;
    if (initialType === "requisition" && item.type !== "consumable") return false;

    // 2. Filter by status (available for assets, not out_of_stock for consumables)
    const isAvailable =
      item.type === "asset" ? item.status === "active" : item.status !== "out_of_stock";
    if (!isAvailable) return false;

    // 3. Filter by search term
    return item.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden />
        <input
          type="search"
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 rounded-lg border border-border bg-bg-subtle pl-9 pr-3 text-sm text-text placeholder:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Search available items"
        />
      </div>
      <div className="max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border">
        {assetsLoading || consumablesLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : items.length === 0 ? (
          <p className="p-4 text-xs text-center text-text-secondary">No items match your search.</p>
        ) : (
          items.map((item) => {
            const categoryMeta = getCategoryStyle(item.category as any);
            const code = item.type === "asset" ? item.assetCode : item.itemCode;
            const isSelected = value?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
                  isSelected ? "bg-accent/10" : "hover:bg-bg-subtle"
                )}
                aria-pressed={isSelected}
              >
                <div
                  className={cn("h-8 w-8 shrink-0 rounded-lg flex items-center justify-center border", categoryMeta.bg, "border-transparent")}
                >
                  <Tag className={cn("h-3.5 w-3.5", categoryMeta.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{item.name}</p>
                  <p className="text-xs text-text-secondary font-mono">{code}</p>
                </div>
                {isSelected && <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Request Details ──────────────────────────────────────────────────

function StepDetails({
  item,
  values,
  onChange,
  errors,
}: {
  item: BrowseItem;
  values: Omit<WizardFormValues, "selectedItem">;
  onChange: (patch: Partial<Omit<WizardFormValues, "selectedItem">>) => void;
  errors: Record<string, string>;
}) {
  const isConsumable = item.type === "consumable";

  return (
    <div className="space-y-4">
      {/* Selected item reminder */}
      <div className="flex items-center gap-3 rounded-lg bg-bg-subtle border border-border px-3 py-2">
        <div
          className={cn(
            "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center",
            getCategoryStyle(item.category as any).bg
          )}
        >
          <Tag className={cn("h-3.5 w-3.5", getCategoryStyle(item.category as any).text)} />
        </div>
        <div>
          <p className="text-sm font-semibold text-text">{item.name}</p>
          <p className="text-xs text-text-secondary font-mono">
            {item.type === "asset" ? item.assetCode : item.itemCode}
          </p>
        </div>
      </div>

      {/* Date range */}
      <div className={cn("grid gap-3", isConsumable ? "grid-cols-1" : "grid-cols-2")}>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-text uppercase tracking-wider">
            {isConsumable ? "Date Needed" : "Date From"} <span className="text-status-outofservice-bg">*</span>
          </label>
          <input
            type="date"
            value={values.dateFrom}
            min={today()}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
            className={cn(
              "w-full h-9 rounded-lg border bg-card px-3 text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              errors.dateFrom ? "border-status-outofservice-bg" : "border-border"
            )}
            aria-describedby={errors.dateFrom ? "date-from-err" : undefined}
          />
          {errors.dateFrom && (
            <p id="date-from-err" className="text-xs text-status-outofservice-bg">{errors.dateFrom}</p>
          )}
        </div>
        {!isConsumable && (
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-text uppercase tracking-wider">
              Date To <span className="text-status-outofservice-bg">*</span>
            </label>
            <input
              type="date"
              value={values.dateTo}
              min={values.dateFrom || today()}
              onChange={(e) => onChange({ dateTo: e.target.value })}
              className={cn(
                "w-full h-9 rounded-lg border bg-card px-3 text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
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

      {/* Quantity (consumables only) */}
      {isConsumable && (
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-text uppercase tracking-wider">
            Quantity <span className="text-status-outofservice-bg">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={item.type === "consumable" ? item.currentQty : undefined}
            value={values.quantity}
            onChange={(e) => onChange({ quantity: Math.max(1, Number(e.target.value)) })}
            className={cn(
              "w-32 h-9 rounded-lg border bg-card px-3 text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              errors.quantity ? "border-status-outofservice-bg" : "border-border"
            )}
          />
          {item.type === "consumable" && (
            <p className="text-xs text-text-secondary">
              Available: {item.currentQty} {item.unit}(s)
            </p>
          )}
          {errors.quantity && (
            <p className="text-xs text-status-outofservice-bg">{errors.quantity}</p>
          )}
        </div>
      )}

      {/* Purpose */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-text uppercase tracking-wider">
          Purpose / Reason <span className="text-status-outofservice-bg">*</span>
        </label>
        <textarea
          value={values.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
          rows={3}
          placeholder="Briefly describe why you need to borrow this item…"
          className={cn(
            "w-full rounded-lg border bg-card px-3 py-2 text-sm text-text placeholder:text-text-secondary resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
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
        <label className="block text-xs font-semibold text-text uppercase tracking-wider">
          Additional Notes <span className="text-text-secondary font-normal normal-case">(optional)</span>
        </label>
        <textarea
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={2}
          placeholder="Any special instructions or requirements…"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-secondary resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>
    </div>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

function StepReview({ values, me }: { values: WizardFormValues, me?: MeProfile }) {
  const { selectedItem } = values;
  if (!selectedItem) return null;
  const categoryMeta = getCategoryStyle(selectedItem.category as any);

  // Use the actual logged-in user or fallback to mock
  const requester = {
    name: me?.name || "Maria Santos",
    email: me?.email || "m.santos@aims.org",
    department: me?.department || "IT",
  };

  return (
    <div className="space-y-6">
      {/* ── Requester Details ────────────────────────────────────────────── */}
      <section aria-labelledby="requester-details-heading" className="space-y-3">
        <h3 id="requester-details-heading" className="text-xs font-bold uppercase tracking-widest text-text-secondary px-1">
          Requester Details
        </h3>
        <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
          <div>
            <p className="text-xs text-text-secondary font-medium">Name</p>
            <p className="font-semibold text-text mt-0.5">{requester.name}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary font-medium">Department</p>
            <p className="font-semibold text-text mt-0.5">{requester.department}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-text-secondary font-medium">Email Address</p>
            <p className="font-semibold text-text mt-0.5">{requester.email}</p>
          </div>
        </div>
      </section>

      {/* ── Request Details ──────────────────────────────────────────────── */}
      <section aria-labelledby="request-details-heading" className="space-y-3">
        <h3 id="request-details-heading" className="text-xs font-bold uppercase tracking-widest text-text-secondary px-1">
          Request Details
        </h3>
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {/* Item Info */}
          <div className="px-4 py-3 flex items-center gap-3 bg-bg-subtle/30">
            <div className={cn("h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border", categoryMeta.bg, "border-transparent")}>
              <Tag className={cn("h-5 w-5", categoryMeta.text)} />
            </div>
            <div>
              <p className="text-sm font-bold text-text">{selectedItem.name}</p>
              <p className="text-xs text-text-secondary font-mono mt-0.5">
                {selectedItem.type === "asset" ? selectedItem.assetCode : selectedItem.itemCode}
                {" · "}
                {categoryMeta.label}
              </p>
            </div>
          </div>

          {/* Dates & Qty */}
          <div className="px-4 py-3 grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div>
              <p className="text-xs text-text-secondary font-medium">{selectedItem.type === "consumable" ? "Date Needed" : "Checkout Date"}</p>
              <p className="font-semibold text-text mt-0.5">{values.dateFrom}</p>
            </div>
            {selectedItem.type === "asset" && (
              <div>
                <p className="text-xs text-text-secondary font-medium">Expected Return Date</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-status-outofservice-bg" />
                  <p className="font-bold text-status-outofservice-bg">{values.dateTo}</p>
                </div>
              </div>
            )}
            {selectedItem.type === "consumable" && (
              <div>
                <p className="text-xs text-text-secondary font-medium">Quantity</p>
                <p className="font-semibold text-text mt-0.5">{values.quantity} {selectedItem.unit ? ` ${selectedItem.unit}(s)` : ""}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Additional Details ─────────────────────────────────────────── */}
      <section aria-label="Request purpose">
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <p className="text-xs text-accent font-medium mb-1">Purpose</p>
          <p className="text-sm font-semibold text-text mt-0.5">
            {values.purpose}
          </p>
        </div>
      </section>

      {/* ── Notes ──────────────────────────────────────────────────────── */}
      {values.notes && (
        <section aria-label="Additional notes">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-1.5">Notes</p>
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
  prefilledItem?: BrowseItem | null;
  initialType?: "borrow" | "requisition" | null;
  onSuccess: (newRequest: PortalBorrowRequest) => void;
}

export function NewBorrowRequestWizard({
  open,
  onOpenChange,
  prefilledItem,
  initialType,
  onSuccess,
}: NewBorrowRequestWizardProps) {
  const [step, setStep] = useState<RequestWizardStep>(
    prefilledItem ? "details" : "select"
  );
  const [values, setValues] = useState<WizardFormValues>({
    selectedItem: prefilledItem ?? null,
    dateFrom: today(),
    dateTo: nextWeek(),
    quantity: 1,
    purpose: "",
    notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (open) {
      setStep(prefilledItem ? "details" : "select");
      setValues({
        selectedItem: prefilledItem ?? null,
        dateFrom: today(),
        dateTo: nextWeek(),
        quantity: 1,
        purpose: "",
        notes: "",
      });
      setFieldErrors({});
      setErrorMessage("");
    }
  }, [open, prefilledItem]);

  const { mutateAsync: createRequest, isPending: isSubmitting, isSuccess: isSubmitted } = useCreateBorrowRequestMutation();
  const { data: me } = useMeQuery();

  const patchValues = useCallback(
    (patch: Partial<WizardFormValues>) => setValues((p) => ({ ...p, ...patch })),
    []
  );

  const canAdvanceSelect = !!values.selectedItem;

  function validateDetails(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!values.dateFrom) errs.dateFrom = "Start date is required.";
    if (values.selectedItem?.type === "asset") {
      if (!values.dateTo) errs.dateTo = "End date is required.";
      else if (values.dateTo < values.dateFrom) errs.dateTo = "End date must be on or after start date.";
    }
    if (!values.purpose.trim()) errs.purpose = "Purpose is required.";
    if (values.selectedItem?.type === "consumable" && values.quantity < 1)
      errs.quantity = "Quantity must be at least 1.";
    return errs;
  }

  function handleNext() {
    if (step === "select") {
      if (!canAdvanceSelect) return;
      setStep("details");
    } else if (step === "details") {
      const errs = validateDetails();
      setFieldErrors(errs);
      if (Object.keys(errs).length === 0) setStep("review");
    }
  }

  function handleBack() {
    if (step === "details") setStep("select");
    if (step === "review") setStep("details");
    setErrorMessage("");
  }

  async function handleSubmit() {
    setErrorMessage("");

    try {
      const newRequest = await createRequest({
        requesterUserId: me?.id,
        requesterName: me?.name || "Maria Santos",
        requesterEmail: me?.email || "m.santos@aims.org",
        department: me?.department || "IT",
        itemDescription: values.selectedItem!.name,
        assetId: values.selectedItem?.type === "asset" ? values.selectedItem.id : undefined,
        assetCode: values.selectedItem?.type === "asset" ? values.selectedItem.assetCode : undefined,
        category: values.selectedItem!.category as any,
        quantity: values.selectedItem?.type === "consumable" ? values.quantity : 1,
        purpose: values.purpose,
        expectedReturnDate: values.dateTo,
        notes: values.notes || undefined,
      });

      onSuccess(newRequest as any);
      onOpenChange(false);
      // Reset
      setStep(prefilledItem ? "details" : "select");
      setValues({
        selectedItem: prefilledItem ?? null,
        dateFrom: today(),
        dateTo: nextWeek(),
        quantity: 1,
        purpose: "",
        notes: "",
      });
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
      <div className="relative z-10 w-full max-w-xl h-[750px] max-h-[90vh] rounded-2xl bg-card border border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
          <div>
            <h2 id="wizard-title" className="text-base font-bold text-text">
              {initialType === "requisition" || values.selectedItem?.type === "consumable" ? "New Requisition Request" : "New Borrow Request"}
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
          {step === "select" && (
            <StepSelect
              value={values.selectedItem}
              onChange={(item) => patchValues({ selectedItem: item })}
              initialType={initialType}
            />
          )}
          {step === "details" && values.selectedItem && (
            <StepDetails
              item={values.selectedItem}
              values={{ dateFrom: values.dateFrom, dateTo: values.dateTo, quantity: values.quantity, purpose: values.purpose, notes: values.notes }}
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
        <div className="flex items-center justify-between gap-3 p-5 border-t border-border">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === "select" || isSubmitting || isSubmitted}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-border text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {step !== "review" ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={step === "select" && !canAdvanceSelect}
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
