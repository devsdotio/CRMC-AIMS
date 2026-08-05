import type { BaseFilterState } from "./filters";

export type StockSeverity = "healthy" | "low" | "critical";

export type ConsumableCategory =
  | "paper"
  | "ink_toner"
  | "cleaning"
  | "office_supplies"
  | "medical";

export type StockActionType = "restock" | "adjustment" | "checkout";

export interface StockHistoryEntry {
  id: string;
  date: string;
  type: StockActionType;
  quantityChange: number;
  actor: string;
  reason?: string;
  notes?: string;
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
