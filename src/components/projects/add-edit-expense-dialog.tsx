"use client";

import { useEffect, useState } from "react";
import { X, Receipt, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ProjectExpenseCategory,
  ProjectExpenseLine,
} from "@/types/projects";
import {
  PROJECT_EXPENSE_CATEGORY_LABELS,
  PROJECT_EXPENSE_LINE_TYPE_LABELS,
} from "@/types/projects";

export type ExpenseFormInput = {
  lineType: "miscellaneous" | "adjustment";
  category: ProjectExpenseCategory;
  description: string;
  amount: string;
  incurredOn: string;
  notes: string;
};

export function AddEditExpenseDialog({
  isOpen,
  expense,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  expense: ProjectExpenseLine | null;
  onClose: () => void;
  onSubmit: (input: ExpenseFormInput) => void | Promise<void>;
}) {
  const isEdit = Boolean(expense);
  const [form, setForm] = useState<ExpenseFormInput>({
    lineType: "miscellaneous",
    category: "miscellaneous",
    description: "",
    amount: "",
    incurredOn: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      lineType:
        expense?.lineType === "adjustment" ? "adjustment" : "miscellaneous",
      category: expense?.category ?? "miscellaneous",
      description: expense?.description ?? "",
      amount: expense?.amount ?? "",
      incurredOn: expense?.incurredOn ?? new Date().toISOString().slice(0, 10),
      notes: expense?.notes ?? "",
    });
    setError("");
    setIsSubmitting(false);
  }, [isOpen, expense]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const fieldClass = cn(
    "w-full h-9 px-3 text-xs bg-bg-subtle border border-border rounded-lg text-text",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
  );
  const labelClass = "block text-[11px] font-bold text-text-secondary mb-1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      setError("Amount must be a non-zero number.");
      return;
    }
    if (form.lineType === "miscellaneous" && amount < 0) {
      setError("Expenses must be positive. Use Adjustment for credits.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit({
        ...form,
        description: form.description.trim(),
        notes: form.notes.trim(),
        category:
          form.lineType === "adjustment" ? "adjustment" : form.category,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense.");
      setIsSubmitting(false);
    }
  };

  const categoryOptions = (
    Object.keys(PROJECT_EXPENSE_CATEGORY_LABELS) as ProjectExpenseCategory[]
  ).filter((c) => c !== "adjustment");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="absolute inset-0"
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-bg border border-border rounded-xl shadow-2xl z-10 overflow-hidden my-4"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-subtle/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              {isEdit ? <Save className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">
                {isEdit ? "Edit expense" : "Add expense"}
              </h2>
              <p className="text-[11px] text-text-secondary">
                Unexpected costs, travel, snacks, adjustments, etc.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-border cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label htmlFor="exp-type" className={labelClass}>
              Type
            </label>
            <select
              id="exp-type"
              value={form.lineType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  lineType: e.target.value as "miscellaneous" | "adjustment",
                  category:
                    e.target.value === "adjustment"
                      ? "adjustment"
                      : f.category === "adjustment"
                        ? "miscellaneous"
                        : f.category,
                }))
              }
              className={cn(fieldClass, "cursor-pointer")}
            >
              {(
                Object.keys(PROJECT_EXPENSE_LINE_TYPE_LABELS) as Array<
                  keyof typeof PROJECT_EXPENSE_LINE_TYPE_LABELS
                >
              ).map((key) => (
                <option key={key} value={key}>
                  {PROJECT_EXPENSE_LINE_TYPE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          {form.lineType === "miscellaneous" && (
            <div>
              <label htmlFor="exp-cat" className={labelClass}>
                Category
              </label>
              <select
                id="exp-cat"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as ProjectExpenseCategory,
                  }))
                }
                className={cn(fieldClass, "cursor-pointer")}
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {PROJECT_EXPENSE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="exp-desc" className={labelClass}>
              Description *
            </label>
            <input
              id="exp-desc"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className={fieldClass}
              placeholder="e.g. Site visit fuel / pizza for crew"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="exp-amount" className={labelClass}>
                Amount (₱) *
              </label>
              <input
                id="exp-amount"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                className={fieldClass}
                placeholder={form.lineType === "adjustment" ? "±0.00" : "0.00"}
              />
              {form.lineType === "adjustment" && (
                <p className="text-[10px] text-text-secondary mt-1">
                  Use negative values for refunds / credits.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="exp-date" className={labelClass}>
                Date incurred
              </label>
              <input
                id="exp-date"
                type="date"
                value={form.incurredOn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, incurredOn: e.target.value }))
                }
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="exp-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="exp-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className={cn(fieldClass, "h-auto py-2 resize-y min-h-14")}
            />
          </div>

          {error && (
            <p className="text-xs text-status-outofservice-text bg-status-outofservice-bg/10 border border-status-outofservice-bg/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-bold rounded-lg border border-border cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-bold rounded-lg bg-accent text-accent-foreground cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Add expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
