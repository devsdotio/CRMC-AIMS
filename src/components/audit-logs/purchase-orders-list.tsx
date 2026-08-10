"use client";

import { ShoppingCart } from "lucide-react";

export function PurchaseOrdersList() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <ShoppingCart className="h-12 w-12 text-text-secondary mb-4 opacity-20" />
      <h3 className="text-lg font-medium text-text">Purchase Orders Log (Coming Soon)</h3>
      <p className="text-sm text-text-secondary max-w-sm mt-1">
        This view is under construction. It will display a ledger of all historical purchase orders.
      </p>
    </div>
  );
}
