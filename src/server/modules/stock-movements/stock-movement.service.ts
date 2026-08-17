import { inArray } from "drizzle-orm";
import { z } from "zod";

import { generateOperationalCode } from "@/server/shared/codes";
import type { ActorContext } from "@/server/shared/auth";
import { getDb } from "@/server/db";
import type { DbSession } from "@/server/db/transaction";
import { departments, projects, type StockMovementRow } from "@/server/db/schema";
import type { LotCostAllocation } from "@/server/modules/purchase-lots/purchase-lot.service";
import { NotFoundError } from "@/server/shared/errors";
import {
  departmentHolderLabel,
  projectHolderLabel,
} from "@/lib/assets-custody";
import { ConsumableRepository } from "@/server/modules/consumables/consumable.repository";
import { consumableIdSchema } from "@/server/modules/consumables/consumable.validation";

import {
  StockMovementRepository,
  type StockMovementListRow,
} from "./stock-movement.repository";

export type StockMovementReason = "restock" | "issue" | "adjust";
export type StockMovementDirection = "in" | "out";

export type RecordMovementLine = {
  qty: number;
  purchaseLotId?: string | null;
  lotCode?: string | null;
  unitCost?: string | null;
  lineTotal?: string | null;
};

export type RecordStockMovementsInput = {
  consumableId: string;
  direction: StockMovementDirection;
  reason: StockMovementReason;
  actor: ActorContext;
  departmentId?: string | null;
  projectId?: string | null;
  requestId?: string | null;
  notes?: string | null;
  lines: RecordMovementLine[];
};

export function allocationsToMovementLines(
  allocations: LotCostAllocation[]
): RecordMovementLine[] {
  return allocations.map((a) => ({
    qty: a.quantity,
    purchaseLotId: a.lotId,
    lotCode: a.lotCode,
    unitCost: a.unitCost,
    lineTotal: a.total,
  }));
}

export type StockMovementDTO = {
  id: string;
  movementCode: string;
  consumableId: string;
  itemCode?: string;
  itemName?: string;
  unit?: string;
  qty: number;
  direction: StockMovementDirection;
  reason: StockMovementReason;
  departmentId: string | null;
  projectId: string | null;
  destinationLabel: string | null;
  purchaseLotId: string | null;
  lotCode: string | null;
  unitCost: string | null;
  lineTotal: string | null;
  requestId: string | null;
  notes: string | null;
  actorName: string;
  createdAt: string;
};

export const listStockMovementsQuerySchema = z.object({
  reason: z.enum(["restock", "issue", "adjust"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

async function destinationLabelsFor(
  rows: Array<{ departmentId: string | null; projectId: string | null }>
): Promise<Map<string, string>> {
  const deptIds = [
    ...new Set(rows.map((r) => r.departmentId).filter((id): id is string => Boolean(id))),
  ];
  const projectIds = [
    ...new Set(rows.map((r) => r.projectId).filter((id): id is string => Boolean(id))),
  ];

  const db = getDb();
  const labels = new Map<string, string>();

  if (deptIds.length > 0) {
    const depts = await db
      .select({
        id: departments.id,
        code: departments.code,
        name: departments.name,
      })
      .from(departments)
      .where(inArray(departments.id, deptIds));
    for (const d of depts) {
      labels.set(`d:${d.id}`, departmentHolderLabel(d.code, d.name));
    }
  }
  if (projectIds.length > 0) {
    const projs = await db
      .select({
        id: projects.id,
        code: projects.projectCode,
        name: projects.name,
      })
      .from(projects)
      .where(inArray(projects.id, projectIds));
    for (const p of projs) {
      labels.set(`p:${p.id}`, projectHolderLabel(p.code, p.name));
    }
  }
  return labels;
}

function destinationLabel(
  row: { departmentId: string | null; projectId: string | null },
  labels: Map<string, string>
): string | null {
  if (row.departmentId) return labels.get(`d:${row.departmentId}`) ?? null;
  if (row.projectId) return labels.get(`p:${row.projectId}`) ?? null;
  return null;
}

function toDTO(
  row: StockMovementRow | StockMovementListRow,
  labels: Map<string, string>
): StockMovementDTO {
  const listed = row as StockMovementListRow;
  return {
    id: row.id,
    movementCode: row.movementCode,
    consumableId: row.consumableId,
    itemCode: listed.itemCode,
    itemName: listed.itemName,
    unit: listed.unit,
    qty: row.qty,
    direction: row.direction,
    reason: row.reason,
    departmentId: row.departmentId,
    projectId: row.projectId,
    destinationLabel: destinationLabel(row, labels),
    purchaseLotId: row.purchaseLotId,
    lotCode: row.lotCode,
    unitCost: row.unitCost,
    lineTotal: row.lineTotal,
    requestId: row.requestId,
    notes: row.notes,
    actorName: row.actorName,
    createdAt: toIso(row.createdAt),
  };
}

export class StockMovementService {
  constructor(
    private readonly repo = new StockMovementRepository(),
    private readonly consumables = new ConsumableRepository()
  ) {}

  async record(
    input: RecordStockMovementsInput,
    session?: DbSession
  ): Promise<void> {
    if (input.lines.length === 0) return;
    await this.repo.createMany(
      input.lines.map((line) => ({
        movementCode: generateOperationalCode("MOV"),
        consumableId: input.consumableId,
        qty: line.qty,
        direction: input.direction,
        reason: input.reason,
        departmentId: input.departmentId ?? null,
        projectId: input.projectId ?? null,
        purchaseLotId: line.purchaseLotId ?? null,
        lotCode: line.lotCode ?? null,
        unitCost: line.unitCost ?? null,
        lineTotal: line.lineTotal ?? null,
        requestId: input.requestId ?? null,
        notes: input.notes ?? null,
        actorUserId: input.actor.userId,
        actorName: input.actor.displayName,
      })),
      session
    );
  }

  async listByConsumable(rawId: string): Promise<StockMovementDTO[]> {
    const id = consumableIdSchema.parse(rawId);
    const item = await this.consumables.findById(id);
    if (!item) throw new NotFoundError("Consumable", id);

    const rows = await this.repo.listByConsumableId(id);
    const labels = await destinationLabelsFor(rows);
    return rows.map((row) =>
      toDTO(
        { ...row, itemCode: item.itemCode, itemName: item.name, unit: item.unit },
        labels
      )
    );
  }

  async list(rawQuery: unknown): Promise<StockMovementDTO[]> {
    const query = listStockMovementsQuerySchema.parse(rawQuery);
    const rows = await this.repo.listRecent({
      reason: query.reason,
      limit: query.limit,
    });
    const labels = await destinationLabelsFor(rows);
    return rows.map((row) => toDTO(row, labels));
  }
}
