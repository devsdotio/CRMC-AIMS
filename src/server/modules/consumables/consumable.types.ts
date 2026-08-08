import type { ConsumableRow, StockHistoryEntry } from "@/server/db/schema";

export type ConsumableDTO = {
  id: string;
  itemCode: string;
  name: string;
  category: "paper" | "ink_toner" | "cleaning" | "office_supplies" | "medical";
  unit: string;
  currentQty: number;
  minThreshold: number;
  location: string;
  supplier?: string;
  lastRestocked: string;
  notes?: string;
  history: StockHistoryEntry[];
};

export type ListConsumableFilters = {
  category?: ConsumableDTO["category"];
  stockLevel?: "all" | "healthy" | "low" | "critical";
  search?: string;
};

export interface IConsumableRepository {
  findById(id: string): Promise<ConsumableRow | null>;
  findByCode(itemCode: string): Promise<ConsumableRow | null>;
  list(filters?: ListConsumableFilters): Promise<ConsumableRow[]>;
  countYear(): Promise<number>;
  countLowStock(): Promise<number>;
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
