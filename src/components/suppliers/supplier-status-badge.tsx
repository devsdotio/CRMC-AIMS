"use client";

import { cn } from "@/lib/utils";
import type { SupplierStatus } from "@/types/suppliers";
import { SUPPLIER_STATUS_LABELS } from "@/types/suppliers";

export function SupplierStatusBadge({ status }: { status: SupplierStatus }) {
  const active = status === "active";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold",
        active
          ? "bg-status-active-bg/20 text-status-active-text"
          : "bg-status-retired-bg/20 text-status-retired-text"
      )}
    >
      {SUPPLIER_STATUS_LABELS[status]}
    </span>
  );
}
