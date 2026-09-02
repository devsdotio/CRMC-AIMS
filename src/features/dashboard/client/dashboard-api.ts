import type {
  DashboardSnapshotDTO,
  DashboardSummaryDTO,
  DashboardNotificationItem,
} from "@/server/modules/dashboard/dashboard.service";
import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";

export type DashboardSnapshot = DashboardSnapshotDTO;
export type DashboardSummary = DashboardSummaryDTO;
export type DashboardNotification = DashboardNotificationItem;

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

  /** Header bell alerts (overdue, pending, low stock). */
  async getNotifications(): Promise<DashboardNotification[]> {
    const res = await fetchJson<ApiResponse<DashboardNotification[]>>(
      "/api/dashboard?scope=notifications"
    );
    return res.data;
  },
};
