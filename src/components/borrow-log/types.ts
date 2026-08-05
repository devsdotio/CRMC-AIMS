/**
 * Shared TypeScript interfaces for Borrow & Return Log feature.
 */

export type LogStatus = "active" | "overdue" | "returned";

export type ReturnCondition = "good" | "damaged" | "needs_repair";

export type AssetCategory = "transport" | "computing" | "av" | "furniture";

export type LogTabFilter = "active" | "overdue" | "returned" | "all";

export interface LogAuditEntry {
  id: string;
  action: "released" | "returned" | "flagged_repair" | "reminder_sent";
  actor: string;
  timestamp: string;
  notes?: string;
}

export interface BorrowLogRecord {
  id: string;
  logCode: string; // e.g. LOG-2026-0041
  requestCode: string; // e.g. REQ-2026-0078
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone: string;
  department: string;
  assetCode: string; // e.g. AV-031
  assetName: string;
  category: AssetCategory;
  releasedAt: string; // ISO date string
  dueDate: string; // YYYY-MM-DD
  returnedAt?: string; // ISO date string
  daysOverdue?: number;
  status: LogStatus;
  conditionOnReturn?: ReturnCondition;
  conditionNotes?: string;
  releasedBy: string; // Custodian name
  receivedBy?: string; // Custodian name on return
  history: LogAuditEntry[];
}

export interface BorrowLogFilterState {
  searchQuery: string;
  department: string;
  startDate: string;
  endDate: string;
}
