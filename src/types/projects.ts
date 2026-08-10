import type { BaseFilterState } from "./filters";

export type ProjectStatus =
  | "draft"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

export type ProjectExpenseLineType =
  | "miscellaneous"
  | "adjustment"
  | "consumable"
  | "material"
  | "asset_writeoff";

export type ProjectExpenseCategory =
  | "travel"
  | "snacks"
  | "labor"
  | "broken_asset"
  | "fees"
  | "adjustment"
  | "miscellaneous";

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  location: string | null;
  department: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  notes: string | null;
  totalSpent: string;
  budgetRemaining: string | null;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  isMutable: boolean;
}

export interface ProjectExpenseLine {
  id: string;
  projectId: string;
  lineType: ProjectExpenseLineType;
  category: ProjectExpenseCategory;
  description: string;
  amount: string;
  quantity: string | null;
  unitCost: string | null;
  consumableId: string | null;
  assetId: string | null;
  incurredOn: string;
  notes: string | null;
  recordedByUserId: string;
  recordedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilterState extends BaseFilterState {
  status: string;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PROJECT_EXPENSE_CATEGORY_LABELS: Record<
  ProjectExpenseCategory,
  string
> = {
  travel: "Travel",
  snacks: "Snacks / Meals",
  labor: "Labor",
  broken_asset: "Broken asset",
  fees: "Fees",
  adjustment: "Adjustment",
  miscellaneous: "Miscellaneous",
};

export const PROJECT_EXPENSE_LINE_TYPE_LABELS: Record<
  "miscellaneous" | "adjustment",
  string
> = {
  miscellaneous: "Expense",
  adjustment: "Adjustment / credit",
};
