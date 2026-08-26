"use client";

/**
 * React Query hooks for dashboard aggregates.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  dashboardApi,
  type DashboardSnapshot,
  type DashboardSummary,
  type DashboardNotification,
} from "./dashboard-api";
import { dashboardQueryKeys } from "./query-keys";

/** Full dashboard widgets — only enable on the dashboard page. */
export function useDashboardSnapshotQuery(options?: {
  enabled?: boolean;
}): UseQueryResult<DashboardSnapshot, Error> {
  return useQuery({
    queryKey: dashboardQueryKeys.snapshot(),
    queryFn: () => dashboardApi.getSnapshot(),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}

/** Nav badge counts — safe to run from the shell; defer with `enabled` so page lists go first. */
export function useDashboardSidebarSummaryQuery(options?: {
  enabled?: boolean;
}): UseQueryResult<DashboardSummary, Error> {
  return useQuery({
    queryKey: dashboardQueryKeys.sidebarSummary(),
    queryFn: () => dashboardApi.getSidebarSummary(),
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}

/** Header notification bell. */
export function useDashboardNotificationsQuery(options?: {
  enabled?: boolean;
}): UseQueryResult<DashboardNotification[], Error> {
  return useQuery({
    queryKey: dashboardQueryKeys.notifications(),
    queryFn: () => dashboardApi.getNotifications(),
    staleTime: 60_000,
    refetchInterval: 120_000,
    enabled: options?.enabled ?? true,
  });
}
