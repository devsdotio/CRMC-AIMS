/**
 * Simplified TypeScript Interfaces for Asset & Inventory Analytics System.
 */

export type SimpleReportCategory =
  | "overview"
  | "asset-inventory"
  | "borrowing"
  | "maintenance"
  | "procurement"
  | "disposal";

export type SimpleUserRole = "staff" | "dept_head" | "admin";

export interface SimpleReportFilterState {
  dateRange: string;
  department: string;
  category: string;
  status: string;
  searchQuery: string;
  roleView: SimpleUserRole;
}

// ─── 1. Asset Inventory Summary ──────────────────────────────────────────────

export interface SimpleAssetItem {
  id: string;
  tagNumber: string;
  serialNumber: string;
  name: string;
  category: string;
  department: string;
  location: string;
  acquisitionDate: string;
  cost: number;
  condition: "Good" | "Fair" | "Poor" | "Damaged";
  status: "In Use" | "In Storage" | "Under Repair" | "Disposed";
}

// ─── 2. Borrowing & Lending ──────────────────────────────────────────────────

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
  category: string;
  borrowCount: number;
  primaryDepartment: string;
}

// ─── 3. Maintenance & Condition ─────────────────────────────────────────────

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

// ─── 4. Procurement / Acquisition ───────────────────────────────────────────

export interface SimpleAcquisitionItem {
  id: string;
  assetName: string;
  category: string;
  department: string;
  quantity: number;
  totalCost: number;
  acquisitionDate: string;
  supplier: string;
}

// ─── 5. Disposal & Write-off ────────────────────────────────────────────────

export interface SimpleDisposalItem {
  id: string;
  assetTag: string;
  assetName: string;
  category: string;
  department: string;
  disposalDate: string;
  disposalReason: "Beyond Economic Repair" | "Obsolescence" | "Lost/Stolen" | "Damaged";
  originalCost: number;
  salvageValue: number;
  approvedBy: string;
}
