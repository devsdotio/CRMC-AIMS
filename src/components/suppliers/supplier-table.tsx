"use client";

import { Truck } from "lucide-react";
import type { Supplier } from "@/types/suppliers";
import { SupplierStatusBadge } from "./supplier-status-badge";

export function SupplierTable({
  suppliers,
  loading,
  onSelect,
  onEdit,
  onDeactivate,
}: {
  suppliers: Supplier[];
  loading?: boolean;
  onSelect: (s: Supplier) => void;
  onEdit: (s: Supplier) => void;
  onDeactivate: (s: Supplier) => void;
}) {
  if (loading) {
    return (
      <div className="p-6 space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-border rounded-lg" />
        ))}
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-subtle border border-border mb-3">
          <Truck className="h-6 w-6 text-text-secondary" />
        </div>
        <p className="text-sm font-bold text-text">No suppliers found</p>
        <p className="text-xs text-text-secondary mt-1 max-w-sm">
          Register vendors so restocks and asset purchases can track unit cost by
          supplier.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" aria-label="Suppliers">
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
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(s)}
                    className="h-7 px-2.5 text-[11px] font-bold rounded-md border border-border bg-bg text-text hover:bg-bg-subtle cursor-pointer"
                  >
                    Edit
                  </button>
                  {s.status === "active" && (
                    <button
                      type="button"
                      onClick={() => onDeactivate(s)}
                      className="h-7 px-2.5 text-[11px] font-bold rounded-md border border-border text-status-outofservice-text hover:bg-status-outofservice-bg/10 cursor-pointer"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
