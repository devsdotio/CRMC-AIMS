import type { ProjectAssetAssignmentRow } from "@/server/db/schema";
import type { ActorContext } from "@/server/shared/auth";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";
import { withTransaction } from "@/server/db/transaction";
import { AssetRepository } from "@/server/modules/assets/asset.repository";
import { AssetLifecycleService } from "@/server/modules/assets/asset.lifecycle.service";

import { ProjectRepository } from "./project.repository";
import { ProjectAssetAssignmentRepository } from "./project-asset.repository";
import type { ProjectAssetAssignmentDTO } from "./project-asset.types";
import {
  assignAssetToProjectSchema,
  assignmentIdSchema,
  returnProjectAssetSchema,
} from "./project-asset.validation";
import { projectIdSchema } from "./project.validation";

function holderLabel(projectCode: string, projectName: string): string {
  return `Project: ${projectCode} (${projectName})`;
}

function toDTO(row: ProjectAssetAssignmentRow): ProjectAssetAssignmentDTO {
  return {
    id: row.id,
    projectId: row.projectId,
    assetId: row.assetId,
    assetCode: row.assetCode,
    assetName: row.assetName,
    status: row.status,
    assignedAt:
      row.assignedAt instanceof Date
        ? row.assignedAt.toISOString()
        : String(row.assignedAt),
    returnedAt: row.returnedAt
      ? row.returnedAt instanceof Date
        ? row.returnedAt.toISOString()
        : String(row.returnedAt)
      : null,
    assignedByName: row.assignedByName,
    returnedByName: row.returnedByName ?? null,
    notes: row.notes ?? null,
    returnNotes: row.returnNotes ?? null,
  };
}

export class ProjectAssetService {
  constructor(
    private readonly assignments = new ProjectAssetAssignmentRepository(),
    private readonly projects = new ProjectRepository(),
    private readonly assets = new AssetRepository(),
    private readonly lifecycle = new AssetLifecycleService()
  ) {}

  private async requireMutableProject(projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundError("Project", projectId);
    if (project.status === "completed") {
      throw new ConflictError(
        "Completed projects are read-only. Asset assignments cannot be changed."
      );
    }
    return project;
  }

  async list(
    rawProjectId: string,
    status?: "assigned" | "returned" | "written_off" | "all"
  ): Promise<ProjectAssetAssignmentDTO[]> {
    const projectId = projectIdSchema.parse(rawProjectId);
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundError("Project", projectId);

    const filter =
      !status || status === "all"
        ? undefined
        : (status as "assigned" | "returned" | "written_off");

    const rows = await this.assignments.listByProject(projectId, filter);
    return rows.map(toDTO);
  }

  async assign(
    rawProjectId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ProjectAssetAssignmentDTO> {
    const projectId = projectIdSchema.parse(rawProjectId);
    const project = await this.requireMutableProject(projectId);
    const input = assignAssetToProjectSchema.parse(rawInput);

    return withTransaction(async (tx) => {
      const asset = await this.assets.findByIdForUpdate(input.assetId, tx);
      if (!asset) throw new NotFoundError("Asset", input.assetId);

      if (asset.status !== "active") {
        throw new BadRequestError(
          "Only active assets can be assigned to a project."
        );
      }
      if (asset.currentHolder) {
        throw new ConflictError(
          `Asset is already in custody of “${asset.currentHolder}”. Return it first.`
        );
      }

      const open = await this.assignments.findOpenByAssetId(asset.id, tx);
      if (open) {
        throw new ConflictError(
          "Asset already has an open project assignment."
        );
      }

      const holder = holderLabel(project.projectCode, project.name);
      const assignment = await this.assignments.create(
        {
          projectId,
          assetId: asset.id,
          assetCode: asset.assetCode,
          assetName: asset.name,
          status: "assigned",
          assignedAt: new Date(),
          returnedAt: null,
          assignedByUserId: actor.userId,
          assignedByName: actor.displayName,
          returnedByUserId: null,
          returnedByName: null,
          notes: input.notes ?? null,
          returnNotes: null,
        },
        tx
      );

      await this.assets.update(
        asset.id,
        {
          currentHolder: holder,
          lastUpdated: new Date(),
        },
        tx
      );

      await this.lifecycle.record(
        {
          assetId: asset.id,
          assetCode: asset.assetCode,
          eventType: "released",
          actor,
          fromStatus: asset.status,
          toStatus: asset.status,
          fromHolder: null,
          toHolder: holder,
          payload: {
            projectId: project.id,
            projectCode: project.projectCode,
            assignmentId: assignment.id,
            source: "project_assignment",
          },
        },
        tx
      );

      return toDTO(assignment);
    });
  }

  async returnAsset(
    rawProjectId: string,
    rawAssignmentId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ProjectAssetAssignmentDTO> {
    const projectId = projectIdSchema.parse(rawProjectId);
    const assignmentId = assignmentIdSchema.parse(rawAssignmentId);
    await this.requireMutableProject(projectId);
    const input = returnProjectAssetSchema.parse(rawInput ?? {});

    return withTransaction(async (tx) => {
      const assignment = await this.assignments.findById(assignmentId, tx);
      if (!assignment || assignment.projectId !== projectId) {
        throw new NotFoundError("Project asset assignment", assignmentId);
      }
      if (assignment.status !== "assigned") {
        throw new ConflictError("This assignment is no longer open.");
      }

      const asset = await this.assets.findByIdForUpdate(assignment.assetId, tx);
      if (!asset) throw new NotFoundError("Asset", assignment.assetId);

      const updated = await this.assignments.update(
        assignment.id,
        {
          status: "returned",
          returnedAt: new Date(),
          returnedByUserId: actor.userId,
          returnedByName: actor.displayName,
          returnNotes: input.notes ?? null,
        },
        tx
      );

      await this.assets.update(
        asset.id,
        {
          currentHolder: null,
          lastUpdated: new Date(),
        },
        tx
      );

      await this.lifecycle.record(
        {
          assetId: asset.id,
          assetCode: asset.assetCode,
          eventType: "returned",
          actor,
          fromStatus: asset.status,
          toStatus: asset.status,
          fromHolder: asset.currentHolder,
          toHolder: null,
          payload: {
            projectId,
            assignmentId: assignment.id,
            source: "project_assignment",
          },
        },
        tx
      );

      if (!updated) throw new NotFoundError("Project asset assignment", assignmentId);
      return toDTO(updated);
    });
  }
}
