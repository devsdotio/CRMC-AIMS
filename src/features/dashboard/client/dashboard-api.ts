import type { DashboardSnapshotDTO } from "@/server/modules/dashboard/dashboard.service";
import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";

export type DashboardSnapshot = DashboardSnapshotDTO;

export const dashboardApi = {
  async getSnapshot(): Promise<DashboardSnapshot> {
    const res = await fetchJson<ApiResponse<DashboardSnapshot>>("/api/dashboard");
    return res.data;
  },
};
