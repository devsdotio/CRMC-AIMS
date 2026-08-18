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
  /** Parent product model when unit belongs to a multi-copy catalog entry. */
  modelId?: string;
  serialNumber?: string;
  location: string;
  currentHolder?: string;
  /** Approved request holding this unit until issue. */
  reservedForRequestId?: string | null;
  department?: string;
  purchaseDate?: string;
  value?: number;
  /** Linked suppliers registry id; null clears on update payloads. */
  supplierId?: string | null;
  imageUrl?: string;
  notes?: string;
  lastUpdated: string;
  maintenanceHistory: MaintenanceLogEntry[];
  /** Canonical QR payload (`CRMC-AIMS:{assetCode}`) for printers / scanners. */
  qrPayload?: string;
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
      | "modelId"
      | "serialNumber"
      | "department"
      | "purchaseDate"
      | "value"
      | "supplierId"
      | "imageUrl"
      | "notes"
      | "lastUpdated"
      | "maintenanceHistory"
    >
  >;

export type UpdateAssetInput = Partial<
  Omit<CreateAssetInput, "supplierId">
> & {
  /** Explicit null clears the linked supplier. */
  supplierId?: string | null;
};

export type ReturnAssetInput = {
  condition: string;
  status?: AssetStatus;
  flagMaintenance?: boolean;
};
