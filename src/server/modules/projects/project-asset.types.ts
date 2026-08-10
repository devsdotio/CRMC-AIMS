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
