"use client";

import { useEffect, useState } from "react";
import { X, Truck, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Supplier, SupplierStatus } from "@/types/suppliers";

export type SupplierFormInput = {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  notes: string;
  status: SupplierStatus;
};

export function AddEditSupplierDialog({
  isOpen,
  supplier,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSubmit: (input: SupplierFormInput) => void | Promise<void>;
}) {
  const isEdit = Boolean(supplier);
  const [form, setForm] = useState<SupplierFormInput>({
    name: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    notes: "",
    status: "active",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      name: supplier?.name ?? "",
      contactName: supplier?.contactName ?? "",
      contactEmail: supplier?.contactEmail ?? "",
      contactPhone: supplier?.contactPhone ?? "",
      address: supplier?.address ?? "",
      notes: supplier?.notes ?? "",
      status: supplier?.status ?? "active",
    });
    setError("");
    setIsSubmitting(false);
  }, [isOpen, supplier]);

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
    if (!form.name.trim()) {
      setError("Supplier name is required.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save supplier.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="absolute inset-0"
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg bg-bg border border-border rounded-xl shadow-2xl z-10 overflow-hidden my-4"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-subtle/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              {isEdit ? <Save className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">
                {isEdit ? "Edit supplier" : "Add supplier"}
              </h2>
              <p className="text-[11px] text-text-secondary">
                {isEdit
                  ? supplier?.supplierCode
                  : "Code is assigned automatically (SUP-YYYY-…)."}
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
            <label htmlFor="sup-name" className={labelClass}>
              Name *
            </label>
            <input
              id="sup-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={fieldClass}
              placeholder="e.g. PaperLine Philippines"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sup-contact" className={labelClass}>
                Contact person
              </label>
              <input
                id="sup-contact"
                value={form.contactName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactName: e.target.value }))
                }
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="sup-phone" className={labelClass}>
                Phone
              </label>
              <input
                id="sup-phone"
                value={form.contactPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactPhone: e.target.value }))
                }
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="sup-email" className={labelClass}>
              Email
            </label>
            <input
              id="sup-email"
              type="email"
              value={form.contactEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, contactEmail: e.target.value }))
              }
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="sup-address" className={labelClass}>
              Address
            </label>
            <input
              id="sup-address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="sup-status" className={labelClass}>
              Status
            </label>
            <select
              id="sup-status"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as SupplierStatus,
                }))
              }
              className={cn(fieldClass, "cursor-pointer")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label htmlFor="sup-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="sup-notes"
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
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
