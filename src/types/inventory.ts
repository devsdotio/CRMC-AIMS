import type { BaseFilterState } from "./filters";

export type StockSeverity = "healthy" | "low" | "critical";

export type ConsumableCategory = string;

export type StockActionType = "restock" | "adjustment" | "checkout";

export interface StockHistoryEntry {
  id: string;
  date: string;
  type: StockActionType;
  quantityChange: number;
  actor: string;
  reason?: string;
  notes?: string;
  unitCost?: string;
  supplierId?: string;
  supplierName?: string;
  lotCode?: string;
  totalCost?: string;
  recipientName?: string;
  lotAllocations?: Array<{
    lotId: string | null;
    lotCode: string | null;
    quantity: number;
    unitCost: string;
    total: string;
    supplierId?: string | null;
    supplierName?: string | null;
    uncosted?: boolean;
  }>;
}

export interface ConsumableItem {
  id: string;
  itemCode: string;
  name: string;
  category: ConsumableCategory;
  unit: string;
  currentQty: number;
  minThreshold: number;
  location: string;
  supplier?: string;
  lastRestocked: string;
  notes?: string;
  history: StockHistoryEntry[];
}

export interface ConsumableFilterState extends BaseFilterState {
  category: string;
  stockLevel: "all" | "healthy" | "low" | "critical";
  sortBy: "critical" | "name" | "qty" | "updated";
}
