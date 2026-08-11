import type { BorrowRequest } from "@/types/borrow-requests";
import type { BorrowLogRecord } from "@/types/borrow-log";
import type { Asset, AssetStatus } from "@/types/assets";
import type { ConsumableItem } from "@/types/inventory";

// ─── Re-exports ───────────────────────────────────────────────────────────────
export type { BorrowRequest, BorrowLogRecord, Asset, AssetStatus, ConsumableItem };

// ─── Portal-specific extensions ───────────────────────────────────────────────

/** Extends the base RequestStatus with portal-side pickup tracking */
export type PortalRequestReleasedStatus = "waiting_pickup" | "released";

export interface PortalBorrowRequest extends BorrowRequest {
  /** Present only when status === "approved" */
  releasedStatus?: PortalRequestReleasedStatus;
  /** For consumables — number of units requested */
  requestedQuantity?: number;
  requestedDateFrom: string;
  requestedDateTo: string;
  itemType: "asset" | "consumable";
}

export type PortalBorrowLogRecord = BorrowLogRecord;

// ─── Browse item union ────────────────────────────────────────────────────────

export type BrowseItemType = "asset" | "consumable";

export interface BrowseAssetItem {
  type: "asset";
  id: string;
  name: string;
  category: string;
  status: AssetStatus;
  assetCode: string;
  location: string;
  notes?: string;
  /** If unavailable, reason to show in disabled tooltip */
  unavailableReason?: string;
}

export interface BrowseConsumableItem {
  type: "consumable";
  id: string;
  name: string;
  category: string;
  status: "available" | "low_stock" | "out_of_stock";
  itemCode: string;
  unit: string;
  currentQty: number;
  location: string;
  notes?: string;
  unavailableReason?: string;
}

export type BrowseItem = BrowseAssetItem | BrowseConsumableItem;

// ─── Wizard ───────────────────────────────────────────────────────────────────

export type RequestWizardStep = "select" | "details" | "review";

export interface WizardFormValues {
  selectedItems: BrowseItem[];
  dateFrom: string;
  dateTo: string;
  quantities: Record<string, number>;
  purpose: string;
  notes: string;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export type ActiveTab = "browse" | "my-requests" | "history";

export type RequestStatusFilter = "all" | "pending" | "approved" | "rejected" | "returned";

// ─── Summary stats ────────────────────────────────────────────────────────────

export interface PortalSummaryStats {
  activeBorrowings: number;
  pendingRequests: number;
  overdueItems: number;
  completedThisSemester: number;
}
