import { requireActor } from "@/server/shared/auth";
import { isAssetOperatorRole } from "@/server/shared/roles";
import { handleError, ok, okWithEtag } from "@/server/shared/http";

import { DashboardService } from "./dashboard.service";

export class DashboardController {
  constructor(private readonly service = new DashboardService()) {}

  async snapshot(request?: Request) {
    try {
      const session = await requireActor();
      const data = isAssetOperatorRole(session.role)
        ? await this.service.getSnapshot()
        : await this.service.getBorrowerSnapshot(session.userId);
      if (request) {
        return okWithEtag(request, data, {
          cacheControl: { maxAge: 15, staleWhileRevalidate: 60 },
        });
      }
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  /** Nav badges — 4 COUNTs max, not the full dashboard widgets. */
  async sidebarSummary(request?: Request) {
    try {
      const session = await requireActor();
      const data = isAssetOperatorRole(session.role)
        ? await this.service.getSidebarSummary()
        : await this.service.getSidebarSummary(session.userId);
      if (request) {
        return okWithEtag(request, data, {
          cacheControl: { maxAge: 15, staleWhileRevalidate: 60 },
        });
      }
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  /** Header notification bell — overdue, pending, low stock. */
  async notifications(request?: Request) {
    try {
      const session = await requireActor();
      const data = isAssetOperatorRole(session.role)
        ? await this.service.getNotifications()
        : await this.service.getNotifications(session.userId);
      if (request) {
        return okWithEtag(request, data, {
          cacheControl: { maxAge: 15, staleWhileRevalidate: 60 },
        });
      }
      return ok(data);
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
