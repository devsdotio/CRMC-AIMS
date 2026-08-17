import { generateOperationalCode } from "@/server/shared/codes";
import type { ActorContext } from "@/server/shared/auth";
import type { DbSession } from "@/server/db/transaction";
import type { LotCostAllocation } from "@/server/modules/purchase-lots/purchase-lot.service";

import { StockMovementRepository } from "./stock-movement.repository";

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

export class StockMovementService {
  constructor(private readonly repo = new StockMovementRepository()) {}

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
}
