/**
 * Shared TypeScript interfaces for Borrow Requests feature.
 */

export type RequestStatus = "pending" | "approved" | "rejected" | "returned";

export type AssetCategory = "transport" | "computing" | "av" | "furniture";

export type TabFilter = "pending" | "approved" | "rejected" | "all";

export interface ActionHistoryLog {
  id: string;
  action: "submitted" | "approved" | "rejected" | "returned";
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
  relativeTime: string;
  expectedReturnDate: string;
  status: RequestStatus;
  notes?: string;
  rejectionReason?: string;
  history: ActionHistoryLog[];
}

export interface FilterState {
  searchQuery: string;
  department: string;
  startDate: string;
  endDate: string;
}
