"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type { PurchaseLot } from "@/types/purchase-lots";
import { purchaseLotsApi } from "./purchase-lots-api";
import { purchaseLotQueryKeys } from "./query-keys";

export function usePurchaseLotsQuery(params?: {
  consumableId?: string;
  assetId?: string;
  supplierId?: string;
  itemType?: "consumable" | "asset";
  enabled?: boolean;
}): UseQueryResult<PurchaseLot[], Error> {
  const { enabled = true, ...filters } = params ?? {};
  return useQuery({
    queryKey: purchaseLotQueryKeys.list(filters),
    queryFn: () => purchaseLotsApi.list(filters),
    enabled,
  });
}
