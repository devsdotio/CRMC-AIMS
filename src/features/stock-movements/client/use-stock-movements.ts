"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  stockMovementsApi,
  type StockMovement,
} from "./stock-movements-api";
import { stockMovementQueryKeys } from "./query-keys";

export function useStockMovementsQuery(filters?: {
  reason?: StockMovement["reason"];
  limit?: number;
  enabled?: boolean;
}): UseQueryResult<StockMovement[], Error> {
  const { enabled = true, ...params } = filters ?? {};
  return useQuery({
    queryKey: stockMovementQueryKeys.list(params),
    queryFn: () => stockMovementsApi.list(params),
    enabled,
  });
}

export function useConsumableMovementsQuery(
  consumableId: string,
  options?: { enabled?: boolean }
): UseQueryResult<StockMovement[], Error> {
  return useQuery({
    queryKey: stockMovementQueryKeys.byConsumable(consumableId),
    queryFn: () => stockMovementsApi.listByConsumable(consumableId),
    enabled: Boolean(consumableId) && (options?.enabled ?? true),
  });
}
