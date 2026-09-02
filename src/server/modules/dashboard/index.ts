import { requireActor } from "@/server/shared/auth";
import { isAssetOperatorRole } from "@/server/shared/roles";
import { handleError, ok } from "@/server/shared/http";

import { DashboardService } from "./dashboard.service";

export class DashboardController {
  constructor(private readonly service = new DashboardService()) {}

  async snapshot() {
    try {
      const session = await requireActor();
      if (isAssetOperatorRole(session.role)) {
        return ok(await this.service.getSnapshot());
      } else {
        return ok(await this.service.getBorrowerSnapshot(session.userId));
      }
    } catch (error) {
      return handleError(error);
    }
  }

  /** Nav badges — 4 COUNTs max, not the full dashboard widgets. */
  async sidebarSummary() {
    try {
      const session = await requireActor();
      if (isAssetOperatorRole(session.role)) {
        return ok(await this.service.getSidebarSummary());
      }
      return ok(await this.service.getSidebarSummary(session.userId));
    } catch (error) {
      return handleError(error);
    }
  }

  /** Header notification bell — overdue, pending, low stock. */
  async notifications() {
    try {
      const session = await requireActor();
      if (isAssetOperatorRole(session.role)) {
        return ok(await this.service.getNotifications());
      }
      return ok(await this.service.getNotifications(session.userId));
    } catch (error) {
      return handleError(error);
    }
  }
}

export const dashboardController = new DashboardController();
export { DashboardService } from "./dashboard.service";
export type {
  DashboardNotificationItem,
  DashboardSnapshotDTO,
  DashboardSummaryDTO,
} from "./dashboard.service";
