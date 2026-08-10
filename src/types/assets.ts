import type { AssetCategory } from './shared';
export type { AssetCategory };
import type { BaseFilterState } from "./filters";

export type AssetStatus = "active" | "needs_repair" | "out_of_service" | "retired";
export type AssetAssignmentType = "borrowable" | "assignable";

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
  assetCode: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  assignmentType: AssetAssignmentType;
  serialNumber?: string;
  location: string;
  currentHolder?: string;
  department?: string;
  purchaseDate?: string;
  value?: number;
  imageUrl?: string;
  notes?: string;
  lastUpdated: string;
  maintenanceHistory: MaintenanceLogEntry[];
}

export interface AssetFilterState extends BaseFilterState {
  categories: AssetCategory[];
  statuses: AssetStatus[];
  sortBy: "name" | "code" | "date";
  sortOrder: "asc" | "desc";
}

export type ViewMode = "grid" | "table";

export type CreateAssetInput = Pick<
  Asset,
  "assetCode" | "name" | "category" | "status" | "location" | "assignmentType"
> &
  Partial<
    Pick<
      Asset,
      | "serialNumber"
      | "currentHolder"
      | "department"
      | "purchaseDate"
      | "value"
      | "imageUrl"
      | "notes"
      | "lastUpdated"
      | "maintenanceHistory"
    >
  >;

export type UpdateAssetInput = Partial<CreateAssetInput>;

export type ReturnAssetInput = {
  condition: string;
  status?: AssetStatus;
};
