"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import { useSandboxVisibility } from "@/components/providers/sandbox-visibility-context";
import {
  STOCK_DOMAINS,
  invalidateDomains,
} from "@/features/shared/cache-invalidation";

import {
  stockMovementsApi,
  type StockMovement,
  type VoidStockMovementPayload,
} from "./stock-movements-api";
import { stockMovementQueryKeys } from "./query-keys";

export function useStockMovementsQuery(filters?: {
  reason?: StockMovement["reason"];
  limit?: number;
  enabled?: boolean;
}): UseQueryResult<StockMovement[], Error> {
  const { includeSandbox } = useSandboxVisibility();
  const { enabled = true, ...params } = filters ?? {};
  const listFilters = { ...params, includeSandbox };
  return useQuery({
    queryKey: stockMovementQueryKeys.list(listFilters),
    queryFn: () => stockMovementsApi.list(listFilters),
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

export function useVoidStockMovementMutation(): UseMutationResult<
  StockMovement,
  Error,
  { id: string; payload?: VoidStockMovementPayload }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) =>
      stockMovementsApi.voidIssue(id, payload ?? {}),
    onSettled: () => {
      void invalidateDomains(qc, [...STOCK_DOMAINS, "projects"]);
    },
  });
}
