/**
 * Shared TypeScript interfaces for Assets Registry feature.
 */

export type AssetStatus = "active" | "needs_repair" | "out_of_service" | "retired";

export type AssetCategory = "transport" | "computing" | "av" | "furniture";

export type ViewMode = "grid" | "table";

export interface MaintenanceLogEntry {
  id: string;
  date: string;
  type: "inspection" | "repair" | "maintenance" | "flagged";
  description: string;
  technician: string;
  cost?: number;
}

export interface Asset {
  id: string;
  assetCode: string; // e.g. AV-031, CP-080
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  serialNumber?: string;
  location: string; // e.g. "Room 302 - IT Office"
  currentHolder?: string; // e.g. "Maria Santos" or undefined if Available
  department?: string;
  purchaseDate?: string;
  value?: number;
  imageUrl?: string;
  notes?: string;
  lastUpdated: string;
  maintenanceHistory: MaintenanceLogEntry[];
}

export interface AssetFilterState {
  searchQuery: string;
  categories: AssetCategory[];
  statuses: AssetStatus[];
  sortBy: "name" | "code" | "date";
  sortOrder: "asc" | "desc";
}
