import type { PurchaseLot } from "@/types/purchase-lots";
import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";

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
};
