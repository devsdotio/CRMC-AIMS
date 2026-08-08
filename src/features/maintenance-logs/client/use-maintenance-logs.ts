"use client";

/**
 * React Query hooks for maintenance logs.
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
  maintenanceLogsApi,
  type CreateMaintenancePayload,
  type MaintenanceLog,
} from "./maintenance-logs-api";
import { maintenanceQueryKeys } from "./query-keys";
import { assetQueryKeys } from "@/features/assets/client/query-keys";

export function useMaintenanceLogsQuery(filters?: {
  openOnly?: boolean;
  search?: string;
  condition?: MaintenanceLog["condition"];
}): UseQueryResult<MaintenanceLog[], Error> {
  return useQuery({
    queryKey: maintenanceQueryKeys.list(filters),
    queryFn: () => maintenanceLogsApi.list(filters),
  });
}

export function useMaintenanceLogQuery(
  id: string
): UseQueryResult<MaintenanceLog, Error> {
  return useQuery({
    queryKey: maintenanceQueryKeys.detail(id),
    queryFn: () => maintenanceLogsApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateMaintenanceLogMutation(): UseMutationResult<
  MaintenanceLog,
  Error,
  CreateMaintenancePayload
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => maintenanceLogsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: maintenanceQueryKeys.all });
      qc.invalidateQueries({ queryKey: assetQueryKeys.all });
    },
  });
}

export function useResolveMaintenanceLogMutation(): UseMutationResult<
  MaintenanceLog,
  Error,
  { id: string; resolutionNotes: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolutionNotes }) =>
      maintenanceLogsApi.resolve(id, resolutionNotes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: maintenanceQueryKeys.all });
      qc.invalidateQueries({ queryKey: assetQueryKeys.all });
    },
  });
}
