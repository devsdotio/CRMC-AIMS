import type {
  DashboardSnapshotDTO,
  DashboardSummaryDTO,
} from "@/server/modules/dashboard/dashboard.service";
import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";

export type DashboardSnapshot = DashboardSnapshotDTO;
export type DashboardSummary = DashboardSummaryDTO;

export const dashboardApi = {
  async getSnapshot(): Promise<DashboardSnapshot> {
    const res = await fetchJson<ApiResponse<DashboardSnapshot>>("/api/dashboard");
    return res.data;
  },

  /** Sidebar badge counts only (cheap). */
  async getSidebarSummary(): Promise<DashboardSummary> {
    const res = await fetchJson<ApiResponse<DashboardSummary>>(
      "/api/dashboard?scope=sidebar"
    );
    return res.data;
  },
};
