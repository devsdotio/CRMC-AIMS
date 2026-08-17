"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  consumablesApi,
  type CreateConsumablePayload,
  type ConsumableItem,
  type RestockPayload,
  type StockAdjustPayload,
  type UpdateConsumablePayload,
} from "./consumables-api";

export type { StockAdjustPayload };
import { consumableQueryKeys } from "./query-keys";
import { purchaseLotQueryKeys } from "@/features/purchase-lots/client/query-keys";
import { stockMovementQueryKeys } from "@/features/stock-movements/client/query-keys";

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: consumableQueryKeys.all });
  qc.invalidateQueries({ queryKey: purchaseLotQueryKeys.all });
  qc.invalidateQueries({ queryKey: stockMovementQueryKeys.all });
}

export function useConsumablesQuery(filters?: {
  category?: ConsumableItem["category"];
  stockLevel?: "all" | "healthy" | "low" | "critical";
  search?: string;
  page?: number;
  limit?: number;
}): UseQueryResult<
  import("@/types/filters").PaginatedResponse<ConsumableItem>,
  Error
> {
  return useQuery({
    queryKey: consumableQueryKeys.list(filters),
    queryFn: () => consumablesApi.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useConsumableQuery(
  id: string,
  options?: { enabled?: boolean }
): UseQueryResult<ConsumableItem, Error> {
  return useQuery({
    queryKey: consumableQueryKeys.detail(id),
    queryFn: () => consumablesApi.getById(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

export function useCreateConsumableMutation(): UseMutationResult<
  ConsumableItem,
  Error,
  CreateConsumablePayload
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => consumablesApi.create(payload),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateConsumableMutation(): UseMutationResult<
  ConsumableItem,
  Error,
  { id: string; payload: UpdateConsumablePayload }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => consumablesApi.update(id, payload),
    onSuccess: () => invalidate(qc),
  });
}

export function useRestockConsumableMutation(): UseMutationResult<
  ConsumableItem,
  Error,
  { id: string; payload: RestockPayload }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => consumablesApi.restock(id, payload),
    onSuccess: () => invalidate(qc),
  });
}

export function useAdjustConsumableMutation(): UseMutationResult<
  ConsumableItem,
  Error,
  { id: string; payload: StockAdjustPayload }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => consumablesApi.adjust(id, payload),
    onSuccess: () => invalidate(qc),
  });
}
