"use client";

import { useEffect, useRef } from "react";
import { X, Pencil, Mail, Phone, MapPin, User, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/types/suppliers";
import { SupplierStatusBadge } from "./supplier-status-badge";
import { usePurchaseLotsQuery } from "@/features/purchase-lots/client";
import { formatPhp } from "@/components/projects/format-money";
import { LoadingState } from "@/components/providers/loading-context";

export function SupplierDetailPanel({
  supplier,
  isOpen,
  onClose,
  onEdit,
}: {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (s: Supplier) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: lots = [], isLoading: lotsLoading } = usePurchaseLotsQuery({
    supplierId: supplier?.id,
    enabled: isOpen && Boolean(supplier),
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative flex flex-col w-full max-w-lg h-full bg-bg border-l border-border shadow-2xl z-10 overflow-hidden",
          "animate-in slide-in-from-right duration-250"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-mono text-lg font-bold tracking-tight text-text">
                {supplier.supplierCode}
              </h2>
              <SupplierStatusBadge status={supplier.status} />
            </div>
            <p className="text-xs text-text-secondary font-medium mt-0.5 truncate">
              Supplier Record • <strong className="text-text font-semibold">{supplier.name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-start gap-2 text-xs">
              <User className="h-3.5 w-3.5 text-text-secondary mt-0.5" />
              <span>{supplier.contactName || "No contact name"}</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <Mail className="h-3.5 w-3.5 text-text-secondary mt-0.5" />
              <span>{supplier.contactEmail || "—"}</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <Phone className="h-3.5 w-3.5 text-text-secondary mt-0.5" />
              <span>{supplier.contactPhone || "—"}</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <MapPin className="h-3.5 w-3.5 text-text-secondary mt-0.5" />
              <span>{supplier.address || "—"}</span>
            </div>
          </div>

          {supplier.notes && (
            <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">
              {supplier.notes}
            </p>
          )}

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              Purchase cost history
            </h3>
            {lotsLoading ? (
              <LoadingState
                variant="card"
                icon="truck"
                message="Loading purchase cost history…"
                subtitle="Retrieving vendor intake records"
              />
            ) : lots.length === 0 ? (
              <p className="text-[11px] text-text-secondary border border-dashed border-border rounded-lg p-3">
                No purchase lots yet. Restocks with unit cost will appear here.
              </p>
            ) : (
              <ul className="space-y-2">
                {lots.slice(0, 20).map((lot) => (
                  <li
                    key={lot.id}
                    className="rounded-lg border border-border bg-bg-subtle/40 px-3 py-2 text-xs"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-bold text-text truncate">
                        {lot.itemName}
                      </span>
                      <span className="font-mono tabular-nums text-text shrink-0">
                        {formatPhp(lot.unitCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-text-secondary mt-0.5">
                      <span className="font-mono">{lot.lotCode}</span>
                      <span>
                        qty {lot.quantity} · {lot.purchasedOn}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="px-6 py-4 border-t border-border bg-bg-subtle/40 shrink-0 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-xs font-bold rounded-lg border border-border bg-bg cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onEdit(supplier)}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-bold rounded-lg bg-accent text-accent-foreground cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
      </aside>
    </div>
  );
}
