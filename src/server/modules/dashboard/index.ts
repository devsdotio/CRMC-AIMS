import { requireAssetOperator } from "@/server/shared/auth";
import { handleError, ok } from "@/server/shared/http";

import { DashboardService } from "./dashboard.service";

export class DashboardController {
  constructor(private readonly service = new DashboardService()) {}

  async snapshot() {
    try {
      await requireAssetOperator();
      return ok(await this.service.getSnapshot());
    } catch (error) {
      return handleError(error);
    }
  }
}

export const dashboardController = new DashboardController();
export { DashboardService } from "./dashboard.service";
export type {
  DashboardSnapshotDTO,
  DashboardSummaryDTO,
} from "./dashboard.service";
