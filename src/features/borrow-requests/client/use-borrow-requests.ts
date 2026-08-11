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

import type {
  ApproveBorrowRequestPayload,
  BorrowRequest,
  CreateBorrowRequestPayload,
  ReleaseBorrowRequestPayload,
} from "./borrow-requests-api";
import { borrowRequestsApi } from "./borrow-requests-api";
import { borrowRequestQueryKeys } from "./query-keys";
import { dashboardQueryKeys } from "@/features/dashboard/client/query-keys";
import type { PaginatedResponse } from "@/features/shared/fetch-json";

export function useBorrowRequests(filters?: {
  status?: BorrowRequest["status"];
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): UseQueryResult<PaginatedResponse<BorrowRequest[]>, Error> {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
      qc.setQueriesData<any>(
        { queryKey: dashboardQueryKeys.snapshot() },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    onSuccess: (_, { id }) => {
      // Optimistically update dashboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
      qc.setQueriesData<any>({ queryKey: dashboardQueryKeys.snapshot() }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          summary: {
            ...old.summary,
            pendingApprovals: Math.max(0, (old.summary?.pendingApprovals || 1) - 1),
          },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pendingRequests: (old.pendingRequests || []).filter((r: any) => r.id !== id),
        };
      });
      qc.invalidateQueries({ queryKey: borrowRequestQueryKeys.all });
      qc.invalidateQueries({ queryKey: dashboardQueryKeys.all });
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
    onSuccess: (_, { id }) => {
      // Optimistically update dashboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
      qc.setQueriesData<any>({ queryKey: dashboardQueryKeys.snapshot() }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          summary: {
            ...old.summary,
            pendingApprovals: Math.max(0, (old.summary?.pendingApprovals || 1) - 1),
          },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pendingRequests: (old.pendingRequests || []).filter((r: any) => r.id !== id),
        };
      });
      qc.invalidateQueries({ queryKey: borrowRequestQueryKeys.all });
      qc.invalidateQueries({ queryKey: dashboardQueryKeys.all });
    },
  });
}

export function useReleaseBorrowRequestMutation(): UseMutationResult<
  BorrowRequest,
  Error,
  { id: string; payload: ReleaseBorrowRequestPayload }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => borrowRequestsApi.release(id, payload),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: borrowRequestQueryKeys.all });
      qc.setQueriesData<BorrowRequest[]>({ queryKey: borrowRequestQueryKeys.list() }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map(req => req.id === id ? { ...req, status: "released" } : req);
      });
      qc.setQueriesData<BorrowRequest>({ queryKey: borrowRequestQueryKeys.detail(id) }, (old) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!old || Array.isArray(old)) return old as any;
        return { ...old, status: "released" };
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: borrowRequestQueryKeys.all });
    },
  });
}

export function useMarkUnreleasedBorrowRequestMutation(): UseMutationResult<
  BorrowRequest,
  Error,
  { id: string; payload?: { note?: string } }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => borrowRequestsApi.markUnreleased(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: borrowRequestQueryKeys.all });
    },
  });
}

export function useMarkReturnedBorrowRequestMutation(): UseMutationResult<
  BorrowRequest,
  Error,
  { id: string; payload: { returnedBy: string; note?: string } }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => borrowRequestsApi.markReturned(id, payload),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: borrowRequestQueryKeys.all });
      qc.setQueriesData<BorrowRequest[]>({ queryKey: borrowRequestQueryKeys.list() }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map(req => req.id === id ? { ...req, status: "returned" } : req);
      });
      qc.setQueriesData<BorrowRequest>({ queryKey: borrowRequestQueryKeys.detail(id) }, (old) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!old || Array.isArray(old)) return old as any;
        return { ...old, status: "returned" };
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: borrowRequestQueryKeys.all });
      qc.invalidateQueries({ queryKey: dashboardQueryKeys.all });
    },
  });
}
