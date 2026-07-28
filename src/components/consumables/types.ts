/**
 * Shared TypeScript interfaces and severity calculations for Consumables feature.
 */

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
  quantityChange: number; // e.g. +50 for restock, -5 for adjustment/usage
  actor: string;
  reason?: string;
  notes?: string;
}

export interface ConsumableItem {
  id: string;
  itemCode: string; // e.g. CON-0102
  name: string;
  category: ConsumableCategory;
  unit: string; // e.g. "reams", "cartridges", "bottles", "boxes"
  currentQty: number;
  minThreshold: number;
  location: string;
  supplier?: string;
  lastRestocked: string;
  notes?: string;
  history: StockHistoryEntry[];
}

export interface ConsumableFilterState {
  searchQuery: string;
  category: string;
  stockLevel: "all" | "healthy" | "low" | "critical";
  sortBy: "critical" | "name" | "qty" | "updated";
}

/**
 * Named helper utility calculating stock severity.
 * - Critical: currentQty <= minThreshold
 * - Low: minThreshold < currentQty <= minThreshold * 1.2
 * - Healthy: currentQty > minThreshold * 1.2
 */
export function getStockSeverity(currentQty: number, minThreshold: number): StockSeverity {
  if (currentQty <= minThreshold) {
    return "critical";
  }
  if (currentQty <= minThreshold * 1.2) {
    return "low";
  }
  return "healthy";
}
