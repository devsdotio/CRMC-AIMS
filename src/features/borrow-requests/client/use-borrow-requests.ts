"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type {
  ApproveBorrowRequestPayload,
  BorrowRequest,
  CreateBorrowRequestPayload,
  ReleaseBorrowRequestPayload,
  UpdateBorrowRequestPayload,
} from "./borrow-requests-api";
import { borrowRequestsApi } from "./borrow-requests-api";
import { borrowRequestQueryKeys } from "./query-keys";
import { consumableQueryKeys } from "@/features/consumables/client/query-keys";
import { purchaseLotQueryKeys } from "@/features/purchase-lots/client/query-keys";
import { auditLogQueryKeys } from "@/features/audit-logs/client/query-keys";
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
  assetId?: string;
  requestType?: "borrowable" | "assignable";
  enabled?: boolean;
}): UseQueryResult<PaginatedResponse<BorrowRequest[]>, Error> {
  const { enabled = true, ...listFilters } = filters ?? {};
  return useQuery({
    queryKey: borrowRequestQueryKeys.list(listFilters),
    queryFn: () => borrowRequestsApi.list(listFilters),
    enabled,
    placeholderData: keepPreviousData,
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
      qc.setQueriesData<PaginatedResponse<BorrowRequest[]>>(
        { queryKey: borrowRequestQueryKeys.list() },
        (old) => {
          if (!old) {
            return {
              data: [newRequest],
              meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            };
          }
          return {
            ...old,
            data: [newRequest, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
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
                items: newRequest.items,
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

export function useUpdateBorrowRequestMutation(): UseMutationResult<
  BorrowRequest,
  Error,
  { id: string; payload: UpdateBorrowRequestPayload }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => borrowRequestsApi.update(id, payload),
    onSuccess: (updated) => {
      qc.setQueriesData<BorrowRequest>(
        { queryKey: borrowRequestQueryKeys.detail(updated.id) },
        () => updated
      );
      qc.invalidateQueries({ queryKey: borrowRequestQueryKeys.all });
      qc.invalidateQueries({ queryKey: dashboardQueryKeys.all });
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
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

export function useCancelBorrowRequestMutation(): UseMutationResult<
  BorrowRequest,
  Error,
  { id: string; note?: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }) => borrowRequestsApi.cancel(id, note),
    onSuccess: (_, { id }) => {
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
      qc.setQueriesData<PaginatedResponse<BorrowRequest[]>>({ queryKey: borrowRequestQueryKeys.list() }, (old) => {
        if (!old || !Array.isArray(old.data)) return old;
        return {
          ...old,
          data: old.data.map(req => req.id === id ? { ...req, status: "released" as const } : req),
        };
      });
      qc.setQueriesData<BorrowRequest>({ queryKey: borrowRequestQueryKeys.detail(id) }, (old) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!old || Array.isArray(old)) return old as any;
        return { ...old, status: "released" };
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: borrowRequestQueryKeys.all });
      qc.invalidateQueries({ queryKey: consumableQueryKeys.all });
      qc.invalidateQueries({ queryKey: purchaseLotQueryKeys.all });
      qc.invalidateQueries({ queryKey: auditLogQueryKeys.all });
      qc.invalidateQueries({ queryKey: dashboardQueryKeys.all });
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
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
      qc.setQueriesData<PaginatedResponse<BorrowRequest[]>>({ queryKey: borrowRequestQueryKeys.list() }, (old) => {
        if (!old || !Array.isArray(old.data)) return old;
        return {
          ...old,
          data: old.data.map(req => req.id === id ? { ...req, status: "returned" as const } : req),
        };
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
