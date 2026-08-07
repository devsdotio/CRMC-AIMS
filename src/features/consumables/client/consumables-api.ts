import type { ConsumableDTO } from "@/server/modules/consumables/consumable.types";
import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";

export type ConsumableItem = ConsumableDTO;

export type CreateConsumablePayload = {
  itemCode?: string;
  name: string;
  category: ConsumableItem["category"];
  unit: string;
  currentQty?: number;
  minThreshold?: number;
  location: string;
  supplier?: string;
  notes?: string;
};

export type UpdateConsumablePayload = {
  name?: string;
  category?: ConsumableItem["category"];
  unit?: string;
  minThreshold?: number;
  location?: string;
  supplier?: string | null;
  notes?: string | null;
};

export type StockMovementPayload = {
  quantity: number;
  reason?: string;
  notes?: string;
};

export type StockAdjustPayload = {
  quantityChange: number;
  reason: string;
  notes?: string;
};

export const consumablesApi = {
  async list(params?: {
    category?: ConsumableItem["category"];
    stockLevel?: "all" | "healthy" | "low" | "critical";
    search?: string;
  }): Promise<ConsumableItem[]> {
    const sp = new URLSearchParams();
    if (params?.category) sp.set("category", params.category);
    if (params?.stockLevel) sp.set("stockLevel", params.stockLevel);
    if (params?.search) sp.set("search", params.search);
    const qs = sp.toString();
    const res = await fetchJson<ApiResponse<ConsumableItem[]>>(
      qs ? `/api/consumables?${qs}` : "/api/consumables"
    );
    return res.data;
  },

  async getById(id: string): Promise<ConsumableItem> {
    const res = await fetchJson<ApiResponse<ConsumableItem>>(
      `/api/consumables/${id}`
    );
    return res.data;
  },

  async create(payload: CreateConsumablePayload): Promise<ConsumableItem> {
    const res = await fetchJson<ApiResponse<ConsumableItem>>("/api/consumables", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async update(
    id: string,
    payload: UpdateConsumablePayload
  ): Promise<ConsumableItem> {
    const res = await fetchJson<ApiResponse<ConsumableItem>>(
      `/api/consumables/${id}`,
      { method: "PATCH", body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async restock(
    id: string,
    payload: StockMovementPayload
  ): Promise<ConsumableItem> {
    const res = await fetchJson<ApiResponse<ConsumableItem>>(
      `/api/consumables/${id}/restock`,
      { method: "POST", body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async checkout(
    id: string,
    payload: StockMovementPayload
  ): Promise<ConsumableItem> {
    const res = await fetchJson<ApiResponse<ConsumableItem>>(
      `/api/consumables/${id}/checkout`,
      { method: "POST", body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async adjust(
    id: string,
    payload: StockAdjustPayload
  ): Promise<ConsumableItem> {
    const res = await fetchJson<ApiResponse<ConsumableItem>>(
      `/api/consumables/${id}/adjust`,
      { method: "POST", body: JSON.stringify(payload) }
    );
    return res.data;
  },
};
