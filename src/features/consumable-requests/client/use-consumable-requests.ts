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
import {
  STOCK_DOMAINS,
  invalidateDomains,
} from "@/features/shared/cache-invalidation";

import {
  consumableRequestsApi,
  type ApproveConsumableRequestPayload,
  type ConsumableRequest,
  type CreateConsumableRequestPayload,
  type ReleaseConsumableRequestPayload,
  type UpdateConsumableRequestPayload,
} from "./consumable-requests-api";
import { consumableRequestQueryKeys } from "./query-keys";

/**
 * Every requisition decision either reserves, frees or issues stock, so the
 * whole stock chain refreshes alongside the queue itself.
 */
function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void invalidateDomains(qc, STOCK_DOMAINS);
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
    onSettled: () => invalidate(qc),
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
  { id: string; payload?: ApproveConsumableRequestPayload; note?: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, note }) =>
      consumableRequestsApi.approve(id, payload ?? (note ? { note } : undefined)),
    onSettled: () => invalidate(qc),
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
    onSettled: () => invalidate(qc),
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
    onSettled: () => invalidate(qc),
  });
}

export function useUndoConsumableRequestApprovalMutation(): UseMutationResult<
  ConsumableRequest,
  Error,
  { id: string; note?: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }) => consumableRequestsApi.undoApproval(id, note),
    onSettled: () => invalidate(qc),
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
    onSettled: () => invalidate(qc),
  });
}
