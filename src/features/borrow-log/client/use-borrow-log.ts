"use client";

/**
 * React Query hooks for borrow/return custody log.
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
  borrowLogApi,
  type BorrowLogRecord,
  type ReleaseBorrowPayload,
  type ReturnBorrowPayload,
} from "./borrow-log-api";
import { borrowLogQueryKeys } from "./query-keys";
import { assetQueryKeys } from "@/features/assets/client/query-keys";
import { borrowRequestQueryKeys } from "@/features/borrow-requests/client/query-keys";
import { maintenanceQueryKeys } from "@/features/maintenance-logs/client/query-keys";

export function useBorrowLogQuery(filters?: {
  status?: BorrowLogRecord["status"];
  department?: string;
  search?: string;
}): UseQueryResult<BorrowLogRecord[], Error> {
  return useQuery({
    queryKey: borrowLogQueryKeys.list(filters),
    queryFn: () => borrowLogApi.list(filters),
  });
}

export function useBorrowLogRecordQuery(
  id: string
): UseQueryResult<BorrowLogRecord, Error> {
  return useQuery({
    queryKey: borrowLogQueryKeys.detail(id),
    queryFn: () => borrowLogApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useReleaseBorrowMutation(): UseMutationResult<
  BorrowLogRecord,
  Error,
  ReleaseBorrowPayload
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => borrowLogApi.release(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: borrowLogQueryKeys.all });
      qc.invalidateQueries({ queryKey: assetQueryKeys.all });
      qc.invalidateQueries({ queryKey: borrowRequestQueryKeys.all });
    },
  });
}

export function useReturnBorrowMutation(): UseMutationResult<
  BorrowLogRecord,
  Error,
  { id: string; payload: ReturnBorrowPayload }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => borrowLogApi.returnLog(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: borrowLogQueryKeys.all });
      qc.invalidateQueries({ queryKey: assetQueryKeys.all });
      qc.invalidateQueries({ queryKey: borrowRequestQueryKeys.all });
      qc.invalidateQueries({ queryKey: maintenanceQueryKeys.all });
    },
  });
}
