import { AssetRepository } from "@/server/modules/assets/asset.repository";
import { BorrowRequestRepository } from "@/server/modules/borrow-requests/borrow-request.repository";
import { BorrowLogRepository } from "@/server/modules/borrow-log/borrow-log.repository";
import { ConsumableRepository } from "@/server/modules/consumables/consumable.repository";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { getDb } from "@/server/db";
import { assetLifecycleEvents } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { toBorrowLogDTO } from "@/server/modules/borrow-log/borrow-log.service";

export type DashboardSummaryDTO = {
  activeBorrows: number;
  pendingApprovals: number;
  lowStockItems: number;
  overdueAssets: number;
};

export type DashboardPendingRequest = {
  id: string;
  requesterName: string;
  department: string;
  itemDescription: string;
  requestedAt: string;
  relativeTime: string;
};

export type DashboardOverdueAsset = {
  id: string;
  assetName: string;
  assetCode: string;
  borrowerName: string;
  department: string;
  daysOverdue: number;
  dueSince: string;
};

export type DashboardLowStockItem = {
  id: string;
  itemName: string;
  currentQty: number;
  minThreshold: number;
  unit: string;
};

export type DashboardCategoryCount = {
  category: string;
  label: string;
  count: number;
};

export type DashboardActivityEntry = {
  id: string;
  type: "return" | "request" | "borrow" | "restock" | "maintenance";
  description: string;
  relativeTime: string;
};

export type DashboardSnapshotDTO = {
  summary: DashboardSummaryDTO;
  pendingRequests: DashboardPendingRequest[];
  overdueAssets: DashboardOverdueAsset[];
  lowStockItems: DashboardLowStockItem[];
  categoryDistribution: DashboardCategoryCount[];
  recentActivity: DashboardActivityEntry[];
};

const CATEGORY_LABELS: Record<string, string> = {
  computing: "Computing",
  furniture: "Furniture",
  av: "AV",
  transport: "Transport",
};

export class DashboardService {
  constructor(
    private readonly requests = new BorrowRequestRepository(),
    private readonly borrowLog = new BorrowLogRepository(),
    private readonly consumables = new ConsumableRepository(),
    private readonly assets = new AssetRepository()
  ) {}

  async getBorrowerSnapshot(userId: string, limit = 5): Promise<DashboardSnapshotDTO> {
    const [
      activeBorrows,
      pendingApprovals,
      overdueAssets,
      pendingRows,
      overdueRows,
    ] = await Promise.all([
      this.borrowLog.countActive(undefined, userId),
      this.requests.countPending(undefined, userId),
      this.borrowLog.countOverdue(undefined, userId),
      this.requests.list({ status: "pending", requesterUserId: userId }),
      this.borrowLog.list({ status: "overdue", borrowerUserId: userId }),
    ]);

    return {
      summary: {
        activeBorrows,
        pendingApprovals,
        lowStockItems: 0,
        overdueAssets,
      },
      pendingRequests: pendingRows.slice(0, limit).map((r) => ({
        id: r.id,
        requesterName: r.requesterName,
        department: r.department,
        itemDescription: r.itemDescription,
        requestedAt:
          r.requestedAt instanceof Date
            ? r.requestedAt.toISOString()
            : String(r.requestedAt),
        relativeTime: formatRelativeTime(r.requestedAt),
      })),
      overdueAssets: overdueRows.slice(0, limit).map((row) => {
        const dto = toBorrowLogDTO(row);
        return {
          id: dto.id,
          assetName: dto.assetName,
          assetCode: dto.assetCode,
          borrowerName: dto.borrowerName,
          department: dto.department,
          daysOverdue: dto.daysOverdue ?? 0,
          dueSince: `${dto.dueDate}T00:00:00Z`,
        };
      }),
      lowStockItems: [],
      categoryDistribution: [],
      recentActivity: [],
    };
  }

  async getSnapshot(limit = 5): Promise<DashboardSnapshotDTO> {
    const [
      activeBorrows,
      pendingApprovals,
      lowStockItems,
      overdueAssets,
      pendingRows,
      overdueRows,
      allConsumables,
      allAssets,
      recentLifecycle,
    ] = await Promise.all([
      this.borrowLog.countActive(),
      this.requests.countPending(),
      this.consumables.countLowStock(),
      this.borrowLog.countOverdue(),
      this.requests.list({ status: "pending" }),
      this.borrowLog.list({ status: "overdue" }),
      this.consumables.getLowStockItems(limit),
      this.assets.getCategoryDistribution(),
      this.listRecentLifecycle(limit),
    ]);

    const lowStock = allConsumables.map((c) => ({
      id: c.id,
      itemName: c.name,
      currentQty: c.currentQty,
      minThreshold: c.minThreshold,
      unit: c.unit,
    }));

    const categoryDistribution: DashboardCategoryCount[] = allAssets.map((c) => ({
      category: c.category,
      label: CATEGORY_LABELS[c.category] ?? c.category,
      count: c.count,
    }));

    return {
      summary: {
        activeBorrows,
        pendingApprovals,
        lowStockItems,
        overdueAssets,
      },
      pendingRequests: pendingRows.slice(0, limit).map((r) => ({
        id: r.id,
        requesterName: r.requesterName,
        department: r.department,
        itemDescription: r.itemDescription,
        requestedAt:
          r.requestedAt instanceof Date
            ? r.requestedAt.toISOString()
            : String(r.requestedAt),
        relativeTime: formatRelativeTime(r.requestedAt),
      })),
      overdueAssets: overdueRows.slice(0, limit).map((row) => {
        const dto = toBorrowLogDTO(row);
        return {
          id: dto.id,
          assetName: dto.assetName,
          assetCode: dto.assetCode,
          borrowerName: dto.borrowerName,
          department: dto.department,
          daysOverdue: dto.daysOverdue ?? 0,
          dueSince: `${dto.dueDate}T00:00:00Z`,
        };
      }),
      lowStockItems: lowStock,
      categoryDistribution,
      recentActivity: recentLifecycle,
    };
  }

  private async listRecentLifecycle(
    limit: number
  ): Promise<DashboardActivityEntry[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(assetLifecycleEvents)
      .orderBy(desc(assetLifecycleEvents.createdAt))
      .limit(limit);

    return rows.map((row) => {
      let type: DashboardActivityEntry["type"] = "borrow";
      let description = `${row.actorDisplayName} · ${row.eventType} on ${row.assetCode}`;

      switch (row.eventType) {
        case "returned":
          type = "return";
          description = `${row.actorDisplayName} returned ${row.assetCode}`;
          break;
        case "released":
          type = "borrow";
          description = `${row.assetCode} released by ${row.actorDisplayName}${
            row.toHolder ? ` → ${row.toHolder}` : ""
          }`;
          break;
        case "flagged_maintenance":
          type = "maintenance";
          description = `${row.assetCode} flagged for maintenance by ${row.actorDisplayName}`;
          break;
        default:
          type = "borrow";
      }

      return {
        id: row.id,
        type,
        description,
        relativeTime: formatRelativeTime(row.createdAt),
      };
    });
  }
}
