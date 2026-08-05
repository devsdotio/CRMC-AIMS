import type { AssetCategory } from './shared';


export type { AssetCategory };
import type  from "./assets";
import type { BaseFilterState } from "./filters";

export type SimpleReportCategory =
  | "overview"
  | "asset-inventory"
  | "borrowing"
  | "maintenance"
  | "procurement"
  | "disposal";

export type SimpleUserRole = "staff" | "dept_head" | "admin";

export interface SimpleReportFilterState extends BaseFilterState {
  dateRange: string;
  department: string;
  category: string;
  status: string;
  roleView: SimpleUserRole;
}

export interface SimpleAssetItem {
  id: string;
  tagNumber: string;
  serialNumber: string;
  name: string;
  category: AssetCategory;
  department: string;
  location: string;
  acquisitionDate: string;
  cost: number;
  condition: "Good" | "Fair" | "Poor" | "Damaged"; // Display-specific condition
  status: "In Use" | "In Storage" | "Under Repair" | "Disposed"; // Display-specific status
}

export interface SimpleBorrowingEntry {
  id: string;
  borrowerName: string;
  borrowerType: "Faculty" | "Student" | "Staff";
  department: string;
  assetTag: string;
  assetName: string;
  borrowedDate: string;
  dueDate: string;
  returnedDate?: string;
  status: "Active" | "Returned" | "Overdue";
  isOverdue: boolean;
}

export interface SimpleFrequentBorrowed {
  assetName: string;
  category: AssetCategory;
  borrowCount: number;
  primaryDepartment: string;
}

export interface SimpleMaintenanceLog {
  id: string;
  assetTag: string;
  assetName: string;
  department: string;
  serviceType: "Routine Check" | "Repair" | "Part Replacement";
  issue: string;
  repairCost: number;
  serviceDate: string;
  isDueForMaintenance: boolean;
  status: "Completed" | "Pending" | "Due Soon";
}

export interface SimpleDamagedLostItem {
  id: string;
  assetTag: string;
  assetName: string;
  department: string;
  type: "Damaged" | "Lost" | "Condemned";
  reportedDate: string;
  costImpact: number;
  reason: string;
}

export interface SimpleAcquisitionItem {
  id: string;
  assetName: string;
  category: AssetCategory;
  department: string;
  quantity: number;
  totalCost: number;
  acquisitionDate: string;
  supplier: string;
}

export interface SimpleDisposalItem {
  id: string;
  assetTag: string;
  assetName: string;
  category: AssetCategory;
  department: string;
  disposalDate: string;
  disposalReason: "Beyond Economic Repair" | "Obsolescence" | "Lost/Stolen" | "Damaged";
  originalCost: number;
  salvageValue: number;
  approvedBy: string;
}
