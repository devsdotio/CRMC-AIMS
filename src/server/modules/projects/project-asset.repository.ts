import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import {
  projectAssetAssignments,
  type NewProjectAssetAssignmentRow,
  type ProjectAssetAssignmentRow,
} from "@/server/db/schema";

import type {
  IProjectAssetAssignmentRepository,
  ProjectAssetAssignmentStatus,
} from "./project-asset.types";

export class ProjectAssetAssignmentRepository
  implements IProjectAssetAssignmentRepository
{
  private db(session?: DbSession) {
    return session ?? getDb();
  }

  async findById(
    id: string,
    session?: DbSession
  ): Promise<ProjectAssetAssignmentRow | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(projectAssetAssignments)
      .where(eq(projectAssetAssignments.id, id))
      .limit(1);
    return row ?? null;
  }

  async listByProject(
    projectId: string,
    status?: ProjectAssetAssignmentStatus,
    session?: DbSession
  ): Promise<ProjectAssetAssignmentRow[]> {
    const db = this.db(session);
    const conditions = [eq(projectAssetAssignments.projectId, projectId)];
    if (status) {
      conditions.push(eq(projectAssetAssignments.status, status));
    }
    return db
      .select()
      .from(projectAssetAssignments)
      .where(and(...conditions))
      .orderBy(desc(projectAssetAssignments.assignedAt));
  }

  async findOpenByAssetId(
    assetId: string,
    session?: DbSession
  ): Promise<ProjectAssetAssignmentRow | null> {
    const db = this.db(session);
    const [row] = await db
      .select()
      .from(projectAssetAssignments)
      .where(
        and(
          eq(projectAssetAssignments.assetId, assetId),
          eq(projectAssetAssignments.status, "assigned")
        )
      )
      .limit(1);
    return row ?? null;
  }

  async create(
    data: Omit<NewProjectAssetAssignmentRow, "id" | "createdAt" | "updatedAt">,
    session?: DbSession
  ): Promise<ProjectAssetAssignmentRow> {
    const db = this.db(session);
    const [row] = await db
      .insert(projectAssetAssignments)
      .values(data)
      .returning();
    if (!row) throw new Error("Failed to create project asset assignment.");
    return row;
  }

  async update(
    id: string,
    data: Partial<
      Omit<ProjectAssetAssignmentRow, "id" | "createdAt" | "projectId">
    >,
    session?: DbSession
  ): Promise<ProjectAssetAssignmentRow | null> {
    const db = this.db(session);
    const [row] = await db
      .update(projectAssetAssignments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projectAssetAssignments.id, id))
      .returning();
    return row ?? null;
  }
}
