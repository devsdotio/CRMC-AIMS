import type { ProjectRow } from "@/server/db/schema";

export type ProjectStatus =
  | "draft"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

/**
 * Public contract for project registry rows.
 * `totalSpent` is 0 until expense lines ship (Phase 2+).
 * Money fields are fixed 2-decimal strings (PHP).
 */
export type ProjectDTO = {
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
  /** False when status is `completed` — UI should hide mutate actions. */
  isMutable: boolean;
};

export type ListProjectFilters = {
  search?: string;
  status?: ProjectStatus;
};

export interface IProjectRepository {
  findById(id: string): Promise<ProjectRow | null>;
  list(filters?: ListProjectFilters): Promise<ProjectRow[]>;
  create(
    data: Omit<
      import("@/server/db/schema").NewProjectRow,
      "id" | "createdAt" | "updatedAt"
    >
  ): Promise<ProjectRow>;
  update(
    id: string,
    data: Partial<Omit<ProjectRow, "id" | "createdAt" | "projectCode">>
  ): Promise<ProjectRow | null>;
  delete(id: string): Promise<boolean>;
}
