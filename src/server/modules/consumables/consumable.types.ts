import type { ConsumableRow, StockHistoryEntry } from "@/server/db/schema";

export type ConsumableDTO = {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  unit: string;
  currentQty: number;
  minThreshold: number;
  location: string;
  supplier?: string;
  lastRestocked: string;
  notes?: string;
  history: StockHistoryEntry[];
};

import type { PaginationParams, PaginatedResponse } from "@/types/filters";

export type ListConsumableFilters = PaginationParams & {
  category?: ConsumableDTO["category"];
  stockLevel?: "all" | "healthy" | "low" | "critical";
  search?: string;
};

export interface IConsumableRepository {
  findById(id: string): Promise<ConsumableRow | null>;
  findByCode(itemCode: string): Promise<ConsumableRow | null>;
  list(filters?: ListConsumableFilters): Promise<PaginatedResponse<ConsumableRow>>;
  countYear(): Promise<number>;
  countLowStock(): Promise<number>;
  getLowStockItems(limit: number): Promise<ConsumableRow[]>;
  create(
    data: Omit<
      import("@/server/db/schema").NewConsumableRow,
      "id" | "createdAt" | "updatedAt"
    >
  ): Promise<ConsumableRow>;
  update(
    id: string,
    data: Partial<Omit<ConsumableRow, "id" | "createdAt" | "itemCode">>
  ): Promise<ConsumableRow | null>;
}
