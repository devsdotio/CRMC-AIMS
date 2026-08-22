"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { PaginatedResponse } from "@/features/shared/fetch-json";
import { consumableQueryKeys } from "@/features/consumables/client/query-keys";
import { purchaseLotQueryKeys } from "@/features/purchase-lots/client/query-keys";
import { dashboardQueryKeys } from "@/features/dashboard/client/query-keys";
import { stockMovementQueryKeys } from "@/features/stock-movements/client/query-keys";

import {
  consumableRequestsApi,
  type ConsumableRequest,
  type CreateConsumableRequestPayload,
  type ReleaseConsumableRequestPayload,
  type UpdateConsumableRequestPayload,
} from "./consumable-requests-api";
import { consumableRequestQueryKeys } from "./query-keys";

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: consumableRequestQueryKeys.all });
  qc.invalidateQueries({ queryKey: consumableQueryKeys.all });
  qc.invalidateQueries({ queryKey: purchaseLotQueryKeys.all });
  qc.invalidateQueries({ queryKey: dashboardQueryKeys.all });
  qc.invalidateQueries({ queryKey: stockMovementQueryKeys.all });
}

export function useConsumableRequests(filters?: {
  status?: ConsumableRequest["status"];
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}): UseQueryResult<PaginatedResponse<ConsumableRequest[]>, Error> {
  return useQuery({
    queryKey: consumableRequestQueryKeys.list(filters),
    queryFn: () => consumableRequestsApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreateConsumableRequestMutation(): UseMutationResult<
  ConsumableRequest,
  Error,
  CreateConsumableRequestPayload
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => consumableRequestsApi.create(payload),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateConsumableRequestMutation(): UseMutationResult<
  ConsumableRequest,
  Error,
  { id: string; payload: UpdateConsumableRequestPayload }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => consumableRequestsApi.update(id, payload),
    onSuccess: (updated) => {
      qc.setQueriesData<ConsumableRequest>(
        { queryKey: consumableRequestQueryKeys.detail(updated.id) },
        () => updated
      );
      invalidate(qc);
    },
  });
}

export function useApproveConsumableRequestMutation(): UseMutationResult<
  ConsumableRequest,
  Error,
  { id: string; note?: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }) => consumableRequestsApi.approve(id, note),
    onSuccess: () => invalidate(qc),
  });
}

export function useRejectConsumableRequestMutation(): UseMutationResult<
  ConsumableRequest,
  Error,
  { id: string; reason: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => consumableRequestsApi.reject(id, reason),
    onSuccess: () => invalidate(qc),
  });
}

export function useCancelConsumableRequestMutation(): UseMutationResult<
  ConsumableRequest,
  Error,
  { id: string; note?: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }) => consumableRequestsApi.cancel(id, note),
    onSuccess: () => invalidate(qc),
  });
}

export function useReleaseConsumableRequestMutation(): UseMutationResult<
  ConsumableRequest,
  Error,
  { id: string; payload: ReleaseConsumableRequestPayload }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => consumableRequestsApi.release(id, payload),
    onSuccess: () => invalidate(qc),
  });
}
