import type { AssetCategory } from './shared';


export type { AssetCategory };
import type { BaseFilterState, DateRangeFilter } from "./filters";

export type RequestStatus = "pending" | "approved" | "rejected" | "released" | "unreleased" | "returned";

export type TabFilter = "pending" | "approved" | "rejected" | "released" | "returned" | "all";

export interface ActionHistoryLog {
  id: string;
  action: "submitted" | "approved" | "rejected" | "released" | "unreleased" | "returned";
  actor: string;
  timestamp: string;
  note?: string;
}

export interface BorrowRequest {
  id: string;
  requestCode: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  department: string;
  itemDescription: string;
  assetCode?: string;
  category: AssetCategory;
  quantity: number;
  purpose: string;
  requestedAt: string;
  expectedReturnDate: string;
  status: RequestStatus;
  notes?: string;
  rejectionReason?: string;
  pickedUpBy?: string;
  history: ActionHistoryLog[];
}

export interface BorrowRequestFilterState extends BaseFilterState, DateRangeFilter {
  department: string;
}
