import type { AssetCategory } from "@/components/assets/types";

export type ConditionState = "good" | "needs_maintenance" | "damaged" | "resolved";

export type LogSource = "return_checkout" | "manual_flag";

export interface MaintenanceLogRecord {
  id: string;
  logCode: string; // e.g. MNT-2026-0031
  assetCode: string; // e.g. AV-031
  assetName: string;
  category: AssetCategory;
  condition: ConditionState;
  source: LogSource;
  dateLogged: string; // YYYY-MM-DD
  loggedBy: string; // Custodian / User name
  notes: string;
  isResolved: boolean;
  resolutionDate?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  relatedBorrowLogCode?: string; // e.g. LOG-2026-0022 if logged on return
  scheduledDate?: string;
}

export interface MaintenanceLogFilterState {
  searchQuery: string;
  categories: AssetCategory[];
  conditions: ConditionState[];
  startDate: string;
  endDate: string;
  openItemsOnly: boolean;
  sortBy: "date_desc" | "date_asc" | "open_first";
}
