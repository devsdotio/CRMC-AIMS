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
  type VoidBorrowPayload,
} from "./borrow-log-api";
import { borrowLogQueryKeys } from "./query-keys";
import {
  CUSTODY_DOMAINS,
  invalidateDomains,
} from "@/features/shared/cache-invalidation";

export function useBorrowLogQuery(filters?: {
  status?: BorrowLogRecord["status"];
  department?: string;
  search?: string;
  custodyKind?: "borrow" | "assignment" | "all";
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
    onSettled: () => {
      void invalidateDomains(qc, CUSTODY_DOMAINS);
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
    onSettled: () => {
      void invalidateDomains(qc, CUSTODY_DOMAINS);
    },
  });
}

export function useVoidBorrowMutation(): UseMutationResult<
  BorrowLogRecord,
  Error,
  { id: string; payload?: VoidBorrowPayload }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => borrowLogApi.voidLog(id, payload ?? {}),
    onSettled: () => {
      void invalidateDomains(qc, CUSTODY_DOMAINS);
    },
  });
}
