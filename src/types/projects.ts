import type { BaseFilterState } from "./filters";

export type ProjectStatus =
  | "draft"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

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
