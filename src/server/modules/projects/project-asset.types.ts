import type { ProjectAssetAssignmentRow } from "@/server/db/schema";

export type ProjectAssetAssignmentStatus =
  | "assigned"
  | "returned"
  | "written_off";

export type ProjectAssetAssignmentDTO = {
  id: string;
  projectId: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  status: ProjectAssetAssignmentStatus;
  assignedAt: string;
  returnedAt: string | null;
  assignedByName: string;
  returnedByName: string | null;
  notes: string | null;
  returnNotes: string | null;
};

/** Result of Phase 5 damage report (maintenance or write-off). */
export type ProjectAssetDamageReportDTO = {
  assignment: ProjectAssetAssignmentDTO;
  mode: "maintenance" | "write_off";
  maintenanceLogCode: string;
  /** Present when mode is write_off and a ledger line was created. */
  expenseId: string | null;
  expenseAmount: string | null;
};

export interface IProjectAssetAssignmentRepository {
  findById(id: string): Promise<ProjectAssetAssignmentRow | null>;
  listByProject(
    projectId: string,
    status?: ProjectAssetAssignmentStatus
  ): Promise<ProjectAssetAssignmentRow[]>;
  findOpenByAssetId(assetId: string): Promise<ProjectAssetAssignmentRow | null>;
  create(
    data: Omit<
      import("@/server/db/schema").NewProjectAssetAssignmentRow,
      "id" | "createdAt" | "updatedAt"
    >
  ): Promise<ProjectAssetAssignmentRow>;
  update(
    id: string,
    data: Partial<
      Omit<ProjectAssetAssignmentRow, "id" | "createdAt" | "projectId">
    >
  ): Promise<ProjectAssetAssignmentRow | null>;
}
