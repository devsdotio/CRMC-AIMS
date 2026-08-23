"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { PurchaseLot } from "@/types/purchase-lots";
import {
  STOCK_DOMAINS,
  invalidateDomains,
} from "@/features/shared/cache-invalidation";
import { purchaseLotsApi, type LotReleaseResult } from "./purchase-lots-api";
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

export function useReleaseFromLotMutation(): UseMutationResult<
  LotReleaseResult,
  Error,
  {
    code: string;
    quantity: number;
    reason?: string;
    notes?: string;
    recipientName?: string;
  }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => purchaseLotsApi.scanRelease(payload),
    onSettled: () => {
      void invalidateDomains(qc, STOCK_DOMAINS);
    },
  });
}
