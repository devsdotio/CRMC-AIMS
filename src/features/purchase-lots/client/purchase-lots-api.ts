import type { PurchaseLot } from "@/types/purchase-lots";
import type { ConsumableItem } from "@/features/consumables/client/consumables-api";
import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";

export type LotReleaseResult = {
  consumable: ConsumableItem;
  lot: PurchaseLot;
  allocation: {
    lotId: string | null;
    lotCode: string | null;
    quantity: number;
    unitCost: string;
    total: string;
    supplierId?: string | null;
    supplierName?: string | null;
  };
};

export const purchaseLotsApi = {
  async list(params?: {
    consumableId?: string;
    assetId?: string;
    supplierId?: string;
    itemType?: "consumable" | "asset";
    search?: string;
  }): Promise<PurchaseLot[]> {
    const sp = new URLSearchParams();
    if (params?.consumableId) sp.set("consumableId", params.consumableId);
    if (params?.assetId) sp.set("assetId", params.assetId);
    if (params?.supplierId) sp.set("supplierId", params.supplierId);
    if (params?.itemType) sp.set("itemType", params.itemType);
    if (params?.search) sp.set("search", params.search);
    const qs = sp.toString();
    const res = await fetchJson<ApiResponse<PurchaseLot[]>>(
      qs ? `/api/purchase-lots?${qs}` : "/api/purchase-lots"
    );
    return res.data;
  },

  async getByCode(code: string): Promise<PurchaseLot> {
    const res = await fetchJson<ApiResponse<PurchaseLot>>(
      `/api/purchase-lots/by-code?code=${encodeURIComponent(code)}`
    );
    return res.data;
  },

  async scanRelease(payload: {
    code: string;
    quantity: number;
    reason?: string;
    notes?: string;
    recipientName?: string;
  }): Promise<LotReleaseResult> {
    const res = await fetchJson<ApiResponse<LotReleaseResult>>(
      "/api/purchase-lots/scan/release",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },
};
