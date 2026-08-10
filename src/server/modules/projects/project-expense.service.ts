import type { ProjectExpenseLineRow } from "@/server/db/schema";
import type { ActorContext } from "@/server/shared/auth";
import { todayDateString } from "@/server/shared/codes";
import {
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";
import { ProjectRepository } from "./project.repository";
import { ProjectExpenseRepository } from "./project-expense.repository";
import type { ProjectExpenseLineDTO } from "./project-expense.types";
import {
  createProjectExpenseSchema,
  expenseIdSchema,
  updateProjectExpenseSchema,
} from "./project-expense.validation";
import { projectIdSchema } from "./project.validation";

function formatMoney(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}

function toDTO(row: ProjectExpenseLineRow): ProjectExpenseLineDTO {
  return {
    id: row.id,
    projectId: row.projectId,
    lineType: row.lineType,
    category: row.category,
    description: row.description,
    amount: formatMoney(row.amount) ?? "0.00",
    quantity: formatMoney(row.quantity),
    unitCost: formatMoney(row.unitCost),
    consumableId: row.consumableId ?? null,
    assetId: row.assetId ?? null,
    incurredOn: row.incurredOn,
    notes: row.notes ?? null,
    recordedByUserId: row.recordedByUserId,
    recordedByName: row.recordedByName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class ProjectExpenseService {
  constructor(
    private readonly expenses = new ProjectExpenseRepository(),
    private readonly projects = new ProjectRepository()
  ) {}

  private async requireMutableProject(projectId: string) {
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundError("Project", projectId);
    if (project.status === "completed") {
      throw new ConflictError(
        "Completed projects are read-only. Expense lines cannot be changed."
      );
    }
    return project;
  }

  async listForProject(rawProjectId: string): Promise<ProjectExpenseLineDTO[]> {
    const projectId = projectIdSchema.parse(rawProjectId);
    const project = await this.projects.findById(projectId);
    if (!project) throw new NotFoundError("Project", projectId);
    const rows = await this.expenses.listByProject(projectId);
    return rows.map(toDTO);
  }

  async create(
    rawProjectId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ProjectExpenseLineDTO> {
    const projectId = projectIdSchema.parse(rawProjectId);
    await this.requireMutableProject(projectId);
    const input = createProjectExpenseSchema.parse(rawInput);

    const lineType = input.lineType;
    const category =
      lineType === "adjustment" ? "adjustment" : input.category;

    const row = await this.expenses.create({
      projectId,
      lineType,
      category,
      description: input.description,
      amount: input.amount,
      quantity: input.quantity,
      unitCost: input.unitCost,
      consumableId: null,
      assetId: null,
      incurredOn: input.incurredOn ?? todayDateString(),
      notes: input.notes ?? null,
      recordedByUserId: actor.userId,
      recordedByName: actor.displayName,
    });

    return toDTO(row);
  }

  async update(
    rawProjectId: string,
    rawExpenseId: string,
    rawInput: unknown
  ): Promise<ProjectExpenseLineDTO> {
    const projectId = projectIdSchema.parse(rawProjectId);
    const expenseId = expenseIdSchema.parse(rawExpenseId);
    await this.requireMutableProject(projectId);

    const existing = await this.expenses.findById(expenseId);
    if (!existing || existing.projectId !== projectId) {
      throw new NotFoundError("Project expense", expenseId);
    }

    // Phase 2 only manages misc/adjustment lines
    if (
      existing.lineType !== "miscellaneous" &&
      existing.lineType !== "adjustment"
    ) {
      throw new ConflictError(
        "This expense line is managed by a later workflow and cannot be edited here."
      );
    }

    const input = updateProjectExpenseSchema.parse(rawInput);
    const nextLineType = input.lineType ?? existing.lineType;
    if (nextLineType !== "miscellaneous" && nextLineType !== "adjustment") {
      throw new ConflictError("Invalid line type for this phase.");
    }

    if (
      (input.lineType === "miscellaneous" ||
        (!input.lineType && existing.lineType === "miscellaneous")) &&
      input.amount !== undefined &&
      Number(input.amount) < 0
    ) {
      throw new ConflictError(
        "Miscellaneous spend must be positive. Use an adjustment line for credits."
      );
    }

    const category =
      nextLineType === "adjustment"
        ? "adjustment"
        : input.category !== undefined
          ? input.category
          : existing.category;

    const updated = await this.expenses.update(expenseId, {
      ...(input.lineType !== undefined ? { lineType: input.lineType } : {}),
      category,
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
      ...(input.unitCost !== undefined ? { unitCost: input.unitCost } : {}),
      ...(input.incurredOn !== undefined
        ? { incurredOn: input.incurredOn }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });

    if (!updated) throw new NotFoundError("Project expense", expenseId);
    return toDTO(updated);
  }

  async delete(
    rawProjectId: string,
    rawExpenseId: string
  ): Promise<void> {
    const projectId = projectIdSchema.parse(rawProjectId);
    const expenseId = expenseIdSchema.parse(rawExpenseId);
    await this.requireMutableProject(projectId);

    const existing = await this.expenses.findById(expenseId);
    if (!existing || existing.projectId !== projectId) {
      throw new NotFoundError("Project expense", expenseId);
    }

    if (
      existing.lineType !== "miscellaneous" &&
      existing.lineType !== "adjustment"
    ) {
      throw new ConflictError(
        "This expense line is managed by a later workflow and cannot be deleted here."
      );
    }

    const deleted = await this.expenses.delete(expenseId);
    if (!deleted) throw new NotFoundError("Project expense", expenseId);
  }
}
