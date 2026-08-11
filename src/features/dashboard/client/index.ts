/**
 * Dashboard client data layer.
 */

export { dashboardApi } from "./dashboard-api";
export type {
  DashboardSnapshot,
  DashboardSummary,
} from "./dashboard-api";
export { dashboardQueryKeys } from "./query-keys";
export {
  useDashboardSidebarSummaryQuery,
  useDashboardSnapshotQuery,
} from "./use-dashboard";
