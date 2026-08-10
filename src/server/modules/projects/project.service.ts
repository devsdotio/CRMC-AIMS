import type { ProjectRow } from "@/server/db/schema";
import type { ActorContext } from "@/server/shared/auth";
import { generateOperationalCode } from "@/server/shared/codes";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";

import { ProjectRepository } from "./project.repository";
import type { ProjectDTO } from "./project.types";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  projectIdSchema,
  updateProjectSchema,
} from "./project.validation";

const ZERO = "0.00";

function formatMoney(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}

function budgetRemaining(
  budget: string | null,
  totalSpent: string
): string | null {
  if (budget === null) return null;
  const b = Number(budget);
  const s = Number(totalSpent);
  if (!Number.isFinite(b) || !Number.isFinite(s)) return null;
  return (b - s).toFixed(2);
}

function toDTO(row: ProjectRow): ProjectDTO {
  const budget = formatMoney(row.budget);
  // Phase 2+ will sum project_expense_lines here.
  const totalSpent = ZERO;

  return {
    id: row.id,
    projectCode: row.projectCode,
    name: row.name,
    description: row.description ?? null,
    status: row.status,
    location: row.location ?? null,
    department: row.department ?? null,
    startDate: row.startDate ?? null,
    endDate: row.endDate ?? null,
    budget,
    notes: row.notes ?? null,
    totalSpent,
    budgetRemaining: budgetRemaining(budget, totalSpent),
    createdByUserId: row.createdByUserId,
    createdByName: row.createdByName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isMutable: row.status !== "completed",
  };
}

function assertMutable(row: ProjectRow): void {
  if (row.status === "completed") {
    throw new ConflictError(
      "Completed projects are read-only. Re-open is not available in this phase."
    );
  }
}

function assertValidDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): void {
  if (startDate && endDate && endDate < startDate) {
    throw new BadRequestError("End date cannot be earlier than start date.");
  }
}

export class ProjectService {
  constructor(private readonly repo = new ProjectRepository()) {}

  async list(rawQuery: unknown): Promise<ProjectDTO[]> {
    const filters = listProjectsQuerySchema.parse(rawQuery ?? {});
    const rows = await this.repo.list(filters);
    return rows.map(toDTO);
  }

  async getById(rawId: string): Promise<ProjectDTO> {
    const id = projectIdSchema.parse(rawId);
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError("Project", id);
    return toDTO(row);
  }

  async create(rawInput: unknown, actor: ActorContext): Promise<ProjectDTO> {
    const input = createProjectSchema.parse(rawInput);
    assertValidDateRange(input.startDate, input.endDate);

    // Completing at create time freezes the project immediately — allow but warn via isMutable.
    const row = await this.repo.create({
      projectCode: generateOperationalCode("PRJ"),
      name: input.name,
      description: input.description ?? null,
      status: input.status,
      location: input.location ?? null,
      department: input.department ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      budget: input.budget,
      notes: input.notes ?? null,
      createdByUserId: actor.userId,
      createdByName: actor.displayName,
    });

    return toDTO(row);
  }

  async update(
    rawId: string,
    rawInput: unknown
  ): Promise<ProjectDTO> {
    const id = projectIdSchema.parse(rawId);
    const input = updateProjectSchema.parse(rawInput);

    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Project", id);
    assertMutable(existing);

    const nextStart =
      input.startDate !== undefined ? input.startDate : existing.startDate;
    const nextEnd =
      input.endDate !== undefined ? input.endDate : existing.endDate;
    assertValidDateRange(nextStart, nextEnd);

    const updated = await this.repo.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.department !== undefined
        ? { department: input.department }
        : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
      ...(input.budget !== undefined ? { budget: input.budget } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });

    if (!updated) throw new NotFoundError("Project", id);
    return toDTO(updated);
  }

  async delete(rawId: string): Promise<void> {
    const id = projectIdSchema.parse(rawId);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Project", id);
    assertMutable(existing);

    if (existing.status === "active" || existing.status === "on_hold") {
      throw new ConflictError(
        "Active or on-hold projects cannot be deleted. Cancel them first, or mark completed when done."
      );
    }

    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundError("Project", id);
  }
}
