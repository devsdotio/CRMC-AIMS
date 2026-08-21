"use client";

import { Loader2, Truck } from "lucide-react";
import type { Supplier } from "@/types/suppliers";
import { SupplierStatusBadge } from "./supplier-status-badge";

function SkeletonTableRow() {
  return (
    <tr className="border-b border-border bg-bg animate-pulse">
      <td className="px-5 py-4">
        <div className="h-4 w-40 bg-border rounded mb-1" />
        <div className="h-3 w-24 bg-border rounded" />
      </td>
      <td className="px-3 py-4">
        <div className="h-5 w-20 bg-border rounded-full" />
      </td>
      <td className="px-3 py-4 hidden md:table-cell">
        <div className="h-3.5 w-32 bg-border rounded" />
      </td>
      <td className="px-3 py-4 hidden lg:table-cell">
        <div className="h-3.5 w-24 bg-border rounded" />
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1.5">
          <div className="h-7 w-12 bg-border rounded-md" />
          <div className="h-7 w-20 bg-border rounded-md" />
        </div>
      </td>
    </tr>
  );
}

function TableHead() {
  return (
    <thead>
      <tr className="border-b border-border bg-bg-subtle text-[11px] font-bold uppercase tracking-wider text-text-secondary">
        <th className="px-5 py-3">Supplier</th>
        <th className="px-3 py-3">Status</th>
        <th className="px-3 py-3 hidden md:table-cell">Contact</th>
        <th className="px-3 py-3 hidden lg:table-cell">Phone</th>
        <th className="px-5 py-3 text-right">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  );
}

export function SupplierTable({
  suppliers,
  loading,
  deactivatingSupplierId = null,
  onSelect,
  onEdit,
  onDeactivate,
}: {
  suppliers: Supplier[];
  loading?: boolean;
  deactivatingSupplierId?: string | null;
  onSelect: (s: Supplier) => void;
  onEdit?: (s: Supplier) => void;
  onDeactivate?: (s: Supplier) => void;
}) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label="Suppliers loading">
          <TableHead />
          <tbody className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 shadow-xs mb-3">
          <Truck className="h-7 w-7" strokeWidth={1.8} />
        </span>
        <p className="text-base font-bold text-text">No suppliers found</p>
        <p className="text-xs text-text-secondary mt-1 max-w-sm leading-relaxed">
          Register vendor profiles to track unit costs, lot codes, and intake shipments.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" aria-label="Suppliers">
        <TableHead />
        <tbody className="divide-y divide-border">
          {suppliers.map((s) => (
            <tr
              key={s.id}
              className="border-b border-border bg-bg hover:bg-bg-subtle/60 transition-colors cursor-pointer"
              onClick={() => onSelect(s)}
            >
              <td className="px-5 py-4">
                <div className="font-bold text-sm text-text">{s.name}</div>
                <div className="text-[11px] font-mono text-text-secondary mt-0.5">
                  {s.supplierCode}
                </div>
              </td>
              <td className="px-3 py-4">
                <SupplierStatusBadge status={s.status} />
              </td>
              <td className="px-3 py-4 text-xs text-text-secondary hidden md:table-cell">
                {s.contactName || s.contactEmail || "—"}
              </td>
              <td className="px-3 py-4 text-xs text-text-secondary hidden lg:table-cell">
                {s.contactPhone || "—"}
              </td>
              <td
                className="px-5 py-4 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                {(onEdit || onDeactivate) && (
                <div className="flex justify-end gap-1.5">
                  {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(s)}
                    className="h-7 px-2.5 text-[11px] font-bold rounded-md border border-border bg-bg text-text hover:bg-bg-subtle cursor-pointer"
                  >
                    Edit
                  </button>
                  )}
                  {onDeactivate && s.status === "active" && (
                    <button
                      type="button"
                      onClick={() => onDeactivate(s)}
                      disabled={deactivatingSupplierId === s.id}
                      className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-bold rounded-md border border-border text-status-outofservice-text hover:bg-status-outofservice-bg/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deactivatingSupplierId === s.id && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {deactivatingSupplierId === s.id
                        ? "Deactivating…"
                        : "Deactivate"}
                    </button>
                  )}
                </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
