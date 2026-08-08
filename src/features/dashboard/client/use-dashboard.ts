"use client";

/**
 * React Query hooks for dashboard aggregates.
 * Ready for page integration — UI still uses mocks until wired.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { dashboardApi, type DashboardSnapshot } from "./dashboard-api";
import { dashboardQueryKeys } from "./query-keys";

export function useDashboardSnapshotQuery(): UseQueryResult<
  DashboardSnapshot,
  Error
> {
  return useQuery({
    queryKey: dashboardQueryKeys.snapshot(),
    queryFn: () => dashboardApi.getSnapshot(),
  });
}
