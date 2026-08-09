"use client";

/**
 * React Query hooks for borrow requests.
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
  borrowRequestsApi,
  type ApproveBorrowRequestPayload,
  type BorrowRequest,
  type CreateBorrowRequestPayload,
} from "./borrow-requests-api";
import { borrowRequestQueryKeys } from "./query-keys";
import { dashboardQueryKeys } from "@/features/dashboard/client/query-keys";

export function useBorrowRequestsQuery(filters?: {
  status?: BorrowRequest["status"];
  department?: string;
  search?: string;
}): UseQueryResult<BorrowRequest[], Error> {
  return useQuery({
    queryKey: borrowRequestQueryKeys.list(filters),
    queryFn: () => borrowRequestsApi.list(filters),
  });
}

export function useBorrowRequestQuery(
  id: string
): UseQueryResult<BorrowRequest, Error> {
  return useQuery({
    queryKey: borrowRequestQueryKeys.detail(id),
    queryFn: () => borrowRequestsApi.getById(id),
    enabled: Boolean(id),
  });
}



export function useCreateBorrowRequestMutation(): UseMutationResult<
  BorrowRequest,
  Error,
  CreateBorrowRequestPayload
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => borrowRequestsApi.create(payload),
    onSuccess: (newRequest) => {
      // 1. Optimistically add to lists
      qc.setQueriesData<BorrowRequest[]>(
        { queryKey: borrowRequestQueryKeys.list() },
        (old) => {
          if (!old) return [newRequest];
          return [newRequest, ...old];
        }
      );

      // 2. Optimistically update dashboard snapshot
      qc.setQueriesData<any>(
        { queryKey: dashboardQueryKeys.snapshot() },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            summary: {
              ...old.summary,
              pendingApprovals: (old.summary?.pendingApprovals || 0) + 1,
            },
            pendingRequests: [
              {
                id: newRequest.id,
                requesterName: newRequest.requesterName,
                department: newRequest.department,
                itemDescription: newRequest.itemDescription,
                requestedAt: newRequest.requestedAt,
                relativeTime: newRequest.relativeTime,
              },
              ...(old.pendingRequests || []),
            ],
          };
        }
      );

      // 3. Eventually consistent re-fetch
      qc.invalidateQueries({ queryKey: borrowRequestQueryKeys.all });
      qc.invalidateQueries({ queryKey: dashboardQueryKeys.all });
    },
  });
}

export function useApproveBorrowRequestMutation(): UseMutationResult<
  BorrowRequest,
  Error,
  { id: string; payload?: ApproveBorrowRequestPayload }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => borrowRequestsApi.approve(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: borrowRequestQueryKeys.all });
    },
  });
}

export function useRejectBorrowRequestMutation(): UseMutationResult<
  BorrowRequest,
  Error,
  { id: string; reason: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => borrowRequestsApi.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: borrowRequestQueryKeys.all });
    },
  });
}
