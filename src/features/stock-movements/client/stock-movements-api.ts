import type { StockMovementDTO } from "@/server/modules/stock-movements";
import { appendIncludeSandbox } from "@/components/providers/sandbox-visibility-context";
import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";

export type StockMovement = StockMovementDTO;

export type VoidStockMovementPayload = {
  reason?: string;
};

export const stockMovementsApi = {
  async list(params?: {
    reason?: StockMovement["reason"];
    limit?: number;
    includeSandbox?: boolean;
  }): Promise<StockMovement[]> {
    const sp = new URLSearchParams();
    if (params?.reason) sp.set("reason", params.reason);
    if (params?.limit) sp.set("limit", String(params.limit));
    appendIncludeSandbox(sp, params?.includeSandbox);
    const qs = sp.toString();
    const res = await fetchJson<ApiResponse<StockMovement[]>>(
      qs ? `/api/stock-movements?${qs}` : "/api/stock-movements"
    );
    return res.data;
  },

  async listByConsumable(id: string): Promise<StockMovement[]> {
    const res = await fetchJson<ApiResponse<StockMovement[]>>(
      `/api/consumables/${id}/movements`
    );
    return res.data;
  },

  async voidIssue(
    id: string,
    payload: VoidStockMovementPayload = {}
  ): Promise<StockMovement> {
    const res = await fetchJson<ApiResponse<StockMovement>>(
      `/api/stock-movements/${id}/void`,
      { method: "POST", body: JSON.stringify(payload) }
    );
    return res.data;
  },
};
