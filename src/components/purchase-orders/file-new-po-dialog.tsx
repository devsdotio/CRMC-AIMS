"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FilePlus2,
  Plus,
  Trash2,
  Calendar,
  User,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useMeQuery } from "@/features/users/client/use-users";
import { useSuppliersQuery } from "@/features/suppliers/client";
import { useCategoriesQuery } from "@/features/categories/client/use-categories";
import {
  useConsumablesQuery,
  useRestockConsumableMutation,
  useCreateConsumableMutation,
} from "@/features/consumables/client";
import { useToast } from "@/components/providers/toast-context";
import { cn } from "@/lib/utils";
import {
  filterMoneyInput,
  filterUnsignedIntInput,
  parseMoney,
  parseUnsignedInt,
} from "@/lib/numeric-input";
import { formatPhp } from "@/components/projects/format-money";

interface FileNewPODialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface POLineItem {
  id: string;
  quantity: string;
  description: string;
  consumableId?: string;
  suggestedDealer: string;
  supplierId?: string;
  purpose: string;
  estimatedCost: string;
}

function generateInitialRow(): POLineItem {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    quantity: "1",
    description: "",
    suggestedDealer: "",
    purpose: "",
    estimatedCost: "",
  };
}

export function FileNewPODialog({
  isOpen,
  onClose,
  onSuccess,
}: FileNewPODialogProps) {
  const { data: me } = useMeQuery();
  const { data: suppliers = [] } = useSuppliersQuery({ activeOnly: true });
  const { data: allCategories = [] } = useCategoriesQuery();
  const { data: consumablePage } = useConsumablesQuery({ limit: 100 });
  const consumables = consumablePage?.data ?? [];
  const restockMutation = useRestockConsumableMutation();
  const createMutation = useCreateConsumableMutation();
  const toast = useToast();

  const defaultCategory =
    allCategories.find((c) => c.type === "consumable")?.name ?? "";

  const [poDate, setPoDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [requestedBy, setRequestedBy] = useState("");
  const [items, setItems] = useState<POLineItem[]>([generateInitialRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (me?.name && !requestedBy) {
      setRequestedBy(me.name);
    }
  }, [me?.name, requestedBy]);

  useEffect(() => {
    if (isOpen) {
      setPoDate(new Date().toISOString().split("T")[0]);
      setItems([generateInitialRow()]);
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [...prev, generateInitialRow()]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (
    id: string,
    field: keyof POLineItem,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "quantity") {
          const next = filterUnsignedIntInput(value);
          return next === null ? item : { ...item, quantity: next };
        }

        if (field === "estimatedCost") {
          const next = filterMoneyInput(value);
          return next === null ? item : { ...item, estimatedCost: next };
        }

        if (field === "description") {
          const matched = consumables.find(
            (c) =>
              c.name.toLowerCase() === value.trim().toLowerCase() ||
              c.id === value
          );
          return {
            ...item,
            description: value,
            consumableId: matched?.id,
          };
        }

        if (field === "suggestedDealer") {
          const matchedSup = suppliers.find(
            (s) =>
              s.name.toLowerCase() === value.trim().toLowerCase() ||
              s.id === value
          );
          return {
            ...item,
            suggestedDealer: value,
            supplierId: matchedSup?.id,
          };
        }

        return { ...item, [field]: value };
      })
    );
  };

  const totalEstimatedAmount = items.reduce((sum, item) => {
    const cost = parseMoney(item.estimatedCost);
    return sum + (cost ?? 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!requestedBy.trim()) {
      setErrorMessage("Requested by is required.");
      return;
    }

    const validItems = items.filter(
      (it) => it.description.trim() && parseUnsignedInt(it.quantity, 0) > 0
    );
    if (validItems.length === 0) {
      setErrorMessage(
        "Please add at least one line item with a description and quantity."
      );
      return;
    }

    for (const item of validItems) {
      const qty = parseUnsignedInt(item.quantity, 0);
      const lineTotal = parseMoney(item.estimatedCost);
      if (lineTotal === null || lineTotal <= 0) {
        setErrorMessage(
          `“${item.description.trim()}” needs an estimated cost greater than zero.`
        );
        return;
      }
      if (!item.supplierId) {
        setErrorMessage(
          `Select a registered supplier for “${item.description.trim()}”.`
        );
        return;
      }
      if (qty < 1) {
        setErrorMessage(
          `Quantity for “${item.description.trim()}” must be at least 1.`
        );
        return;
      }
    }

    if (!defaultCategory) {
      setErrorMessage(
        "No consumable categories yet. Add one under Settings → Categories first."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      for (const item of validItems) {
        const qty = parseUnsignedInt(item.quantity, 0);
        const lineTotal = parseMoney(item.estimatedCost) ?? 0;
        let targetConsumableId = item.consumableId;

        if (!targetConsumableId) {
          const createdItem = await createMutation.mutateAsync({
            name: item.description.trim(),
            category: defaultCategory,
            location: "Main Property Supply",
            unit: "pcs",
            currentQty: 0,
            minThreshold: 5,
            supplierId: item.supplierId,
            supplier: item.suggestedDealer.trim() || undefined,
          });
          targetConsumableId = createdItem.id;
        }

        const unitCost = qty > 0 ? (lineTotal / qty).toFixed(2) : "0.00";

        await restockMutation.mutateAsync({
          id: targetConsumableId,
          payload: {
            quantity: qty,
            unitCost: parseFloat(unitCost),
            supplierId: item.supplierId || null,
            reason: item.purpose || "Official Purchase Order Intake",
            notes: `PO Date: ${poDate} · Req by: ${requestedBy.trim()}`,
            purchasedOn: poDate,
          },
        });
      }

      toast.success(
        `${validItems.length} intake lot${validItems.length === 1 ? "" : "s"} filed successfully.`
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to file Purchase Order.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-po-title"
        className="relative w-full max-w-3xl rounded-2xl border border-border bg-bg shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
          <div className="flex items-center gap-2">
            <FilePlus2 className="h-5 w-5 text-accent" />
            <div>
              <h2 id="new-po-title" className="text-base font-bold text-text">
                File New Purchase Order
              </h2>
              <p className="text-[11px] text-text-secondary">
                Official Cebu Roosevelt Memorial Colleges, Inc. PO Slip
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-border/60 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-status-outofservice-bg/10 border border-status-outofservice-bg/30 text-status-outofservice-text flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Institution & Metadata Row */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold text-text uppercase tracking-wider text-[11px]">
                Cebu Roosevelt Memorial Colleges, Inc.
              </span>
              <span className="text-[10px] text-text-secondary">
                San Vicente St., Bogo City, Cebu
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-text flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-text-secondary" />
                  Order Date
                </label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg border border-border bg-bg-subtle text-text text-xs focus:bg-bg focus:ring-1 focus:ring-ring focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-text-secondary" />
                  Requested By
                </label>
                <input
                  type="text"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  placeholder="Enter requester / custodian staff name"
                  required
                  className="w-full h-9 px-3 rounded-lg border border-border bg-bg-subtle text-text text-xs focus:bg-bg focus:ring-1 focus:ring-ring focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table (5 Core Columns from Photo) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text uppercase tracking-wider text-[11px]">
                Line Items (PO Table)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-border bg-bg hover:bg-bg-subtle text-text transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-accent" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-bg-subtle text-text border-b border-border font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-3 py-2 text-center w-16 border-r border-border">Qty</th>
                      <th className="px-3 py-2 border-r border-border min-w-[180px]">Description</th>
                      <th className="px-3 py-2 border-r border-border min-w-[150px]">Suggested Dealer</th>
                      <th className="px-3 py-2 border-r border-border min-w-[140px]">Purpose</th>
                      <th className="px-3 py-2 border-r border-border min-w-[110px] text-right">Estimated (₱)</th>
                      <th className="px-2 py-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-bg-subtle/40 transition-colors">
                        {/* 1. Quantity */}
                        <td className="p-2 border-r border-border">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(item.id, "quantity", e.target.value)
                            }
                            required
                            placeholder="1"
                            className="w-14 h-8 px-1.5 text-center font-bold font-mono rounded-md border border-border bg-bg text-text focus:ring-1 focus:ring-ring focus:outline-hidden"
                          />
                        </td>

                        {/* 2. Description */}
                        <td className="p-2 border-r border-border">
                          <input
                            type="text"
                            list="catalog-items-list"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(item.id, "description", e.target.value)
                            }
                            placeholder="Item name / specs..."
                            required
                            className="w-full h-8 px-2.5 rounded-md border border-border bg-bg text-text focus:ring-1 focus:ring-ring focus:outline-hidden font-medium"
                          />
                        </td>

                        {/* 3. Suggested Dealer */}
                        <td className="p-2 border-r border-border">
                          <input
                            type="text"
                            list="suppliers-list"
                            value={item.suggestedDealer}
                            onChange={(e) =>
                              handleItemChange(item.id, "suggestedDealer", e.target.value)
                            }
                            placeholder="Select supplier…"
                            required
                            className={cn(
                              "w-full h-8 px-2.5 rounded-md border bg-bg text-text focus:ring-1 focus:ring-ring focus:outline-hidden",
                              item.suggestedDealer && !item.supplierId
                                ? "border-status-outofservice-bg/50"
                                : "border-border"
                            )}
                          />
                          {item.suggestedDealer && !item.supplierId && (
                            <p className="text-[10px] text-status-outofservice-text mt-0.5">
                              Pick a registered supplier
                            </p>
                          )}
                        </td>

                        {/* 4. Purpose */}
                        <td className="p-2 border-r border-border">
                          <input
                            type="text"
                            value={item.purpose}
                            onChange={(e) =>
                              handleItemChange(item.id, "purpose", e.target.value)
                            }
                            placeholder="Usage / Department..."
                            className="w-full h-8 px-2.5 rounded-md border border-border bg-bg text-text focus:ring-1 focus:ring-ring focus:outline-hidden"
                          />
                        </td>

                        {/* 5. Estimated */}
                        <td className="p-2 border-r border-border text-right">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.estimatedCost}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "estimatedCost",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                            required
                            className="w-24 h-8 px-2 text-right font-mono font-bold rounded-md border border-border bg-bg text-text focus:ring-1 focus:ring-ring focus:outline-hidden"
                          />
                        </td>

                        {/* Remove Row */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={items.length <= 1}
                            className="p-1 rounded-md text-text-secondary hover:text-status-outofservice-text hover:bg-status-outofservice-bg/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Datalists for autocompletion */}
            <datalist id="catalog-items-list">
              {consumables.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.itemCode} · {c.category}
                </option>
              ))}
            </datalist>

            <datalist id="suppliers-list">
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.supplierCode}
                </option>
              ))}
            </datalist>
          </div>

          {/* Summary & Sign-off Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <ShieldCheck className="h-4 w-4" />
                <span>Approval Authority</span>
              </div>
              <p className="font-bold text-text text-sm">JACINTO ANTONIO R. LEPITEN JR.</p>
              <p className="text-[10px] text-text-secondary">Head Property Custodian</p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1 text-right flex flex-col justify-center">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                Total Estimated PO Value
              </span>
              <span className="text-lg font-mono font-bold text-status-active-text">
                {formatPhp(totalEstimatedAmount)}
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="p-4 -mx-6 -mb-6 mt-4 border-t border-border bg-bg-subtle flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-bg hover:bg-bg-subtle text-text transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Filing PO...</span>
                </>
              ) : (
                <>
                  <FilePlus2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span>File Purchase Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
