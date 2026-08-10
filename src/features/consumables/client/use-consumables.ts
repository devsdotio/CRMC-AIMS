"use client";

/**
 * React Query hooks for consumables stock.
 * Ready for page integration — UI still uses mocks until wired.
 */

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
  type StockMovementPayload,
  type UpdateConsumablePayload,
} from "./consumables-api";
import { consumableQueryKeys } from "./query-keys";

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: consumableQueryKeys.all });
}

export function useConsumablesQuery(filters?: {
  category?: ConsumableItem["category"];
  stockLevel?: "all" | "healthy" | "low" | "critical";
  search?: string;
  page?: number;
  limit?: number;
}): UseQueryResult<import("@/types/filters").PaginatedResponse<ConsumableItem>, Error> {
  return useQuery({
    queryKey: consumableQueryKeys.list(filters),
    queryFn: () => consumablesApi.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useConsumableQuery(
  id: string
): UseQueryResult<ConsumableItem, Error> {
  return useQuery({
    queryKey: consumableQueryKeys.detail(id),
    queryFn: () => consumablesApi.getById(id),
    enabled: Boolean(id),
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

export function useCheckoutConsumableMutation(): UseMutationResult<
  ConsumableItem,
  Error,
  { id: string; payload: StockMovementPayload }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => consumablesApi.checkout(id, payload),
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
