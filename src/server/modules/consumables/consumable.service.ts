import type { ConsumableRow, StockHistoryEntry } from "@/server/db/schema";
import { formatSequentialCode, todayDateString } from "@/server/shared/codes";
import type { ActorContext } from "@/server/shared/auth";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";

import { ConsumableRepository } from "./consumable.repository";
import type { ConsumableDTO, IConsumableRepository } from "./consumable.types";
import {
  consumableIdSchema,
  createConsumableSchema,
  listConsumablesQuerySchema,
  stockAdjustSchema,
  stockMovementSchema,
  updateConsumableSchema,
} from "./consumable.validation";

function getStockSeverity(
  currentQty: number,
  minThreshold: number
): "healthy" | "low" | "critical" {
  if (currentQty <= minThreshold) return "critical";
  if (currentQty <= minThreshold * 1.2) return "low";
  return "healthy";
}

function toDTO(row: ConsumableRow): ConsumableDTO {
  const history = Array.isArray(row.history) ? row.history : [];
  return {
    id: row.id,
    itemCode: row.itemCode,
    name: row.name,
    category: row.category,
    unit: row.unit,
    currentQty: row.currentQty,
    minThreshold: row.minThreshold,
    location: row.location,
    supplier: row.supplier ?? undefined,
    lastRestocked: row.lastRestocked
      ? row.lastRestocked instanceof Date
        ? row.lastRestocked.toISOString().slice(0, 10)
        : String(row.lastRestocked).slice(0, 10)
      : "—",
    notes: row.notes ?? undefined,
    history,
  };
}

function historyEntry(
  type: StockHistoryEntry["type"],
  quantityChange: number,
  actor: string,
  reason?: string,
  notes?: string
): StockHistoryEntry {
  return {
    id: crypto.randomUUID(),
    date: todayDateString(),
    type,
    quantityChange,
    actor,
    ...(reason ? { reason } : {}),
    ...(notes ? { notes } : {}),
  };
}

export class ConsumableService {
  constructor(
    private readonly repo: IConsumableRepository = new ConsumableRepository()
  ) {}

  async list(rawQuery: unknown): Promise<ConsumableDTO[]> {
    const filters = listConsumablesQuerySchema.parse(rawQuery ?? {});
    let rows = await this.repo.list({
      category: filters.category,
      search: filters.search,
      stockLevel: filters.stockLevel === "critical" ? "critical" : undefined,
    });

    if (filters.stockLevel && filters.stockLevel !== "all") {
      rows = rows.filter((row) => {
        const severity = getStockSeverity(row.currentQty, row.minThreshold);
        if (filters.stockLevel === "healthy") return severity === "healthy";
        if (filters.stockLevel === "low") return severity === "low";
        if (filters.stockLevel === "critical") return severity === "critical";
        return true;
      });
    }

    return rows.map(toDTO);
  }

  async getById(rawId: string): Promise<ConsumableDTO> {
    const id = consumableIdSchema.parse(rawId);
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError("Consumable", id);
    return toDTO(row);
  }

  async create(rawInput: unknown, actor: ActorContext): Promise<ConsumableDTO> {
    const input = createConsumableSchema.parse(rawInput);
    const itemCode =
      input.itemCode?.trim() ||
      formatSequentialCode("CON", (await this.repo.countYear()) + 1);

    const exists = await this.repo.findByCode(itemCode);
    if (exists) {
      throw new ConflictError(`Item code ${itemCode} already exists.`);
    }

    const history: StockHistoryEntry[] =
      input.currentQty > 0
        ? [
            historyEntry(
              "restock",
              input.currentQty,
              actor.displayName,
              "Initial stock"
            ),
          ]
        : [];

    const row = await this.repo.create({
      itemCode,
      name: input.name,
      category: input.category,
      unit: input.unit,
      currentQty: input.currentQty,
      minThreshold: input.minThreshold,
      location: input.location,
      supplier: input.supplier ?? null,
      lastRestocked: input.currentQty > 0 ? new Date() : null,
      notes: input.notes ?? null,
      history,
    });

    return toDTO(row);
  }

  async update(rawId: string, rawInput: unknown): Promise<ConsumableDTO> {
    const id = consumableIdSchema.parse(rawId);
    const input = updateConsumableSchema.parse(rawInput);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Consumable", id);

    const updated = await this.repo.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
      ...(input.minThreshold !== undefined
        ? { minThreshold: input.minThreshold }
        : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.supplier !== undefined ? { supplier: input.supplier } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });
    if (!updated) throw new NotFoundError("Consumable", id);
    return toDTO(updated);
  }

  async restock(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ConsumableDTO> {
    const id = consumableIdSchema.parse(rawId);
    const input = stockMovementSchema.parse(rawInput);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Consumable", id);

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry(
        "restock",
        input.quantity,
        actor.displayName,
        input.reason,
        input.notes
      ),
    ];

    const updated = await this.repo.update(id, {
      currentQty: existing.currentQty + input.quantity,
      lastRestocked: new Date(),
      history,
    });
    if (!updated) throw new NotFoundError("Consumable", id);
    return toDTO(updated);
  }

  async checkout(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ConsumableDTO> {
    const id = consumableIdSchema.parse(rawId);
    const input = stockMovementSchema.parse(rawInput);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Consumable", id);

    if (existing.currentQty < input.quantity) {
      throw new BadRequestError(
        `Insufficient stock. Available: ${existing.currentQty} ${existing.unit}.`
      );
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry(
        "checkout",
        -input.quantity,
        actor.displayName,
        input.reason,
        input.notes
      ),
    ];

    const updated = await this.repo.update(id, {
      currentQty: existing.currentQty - input.quantity,
      history,
    });
    if (!updated) throw new NotFoundError("Consumable", id);
    return toDTO(updated);
  }

  async adjust(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ConsumableDTO> {
    const id = consumableIdSchema.parse(rawId);
    const input = stockAdjustSchema.parse(rawInput);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Consumable", id);

    const next = existing.currentQty + input.quantityChange;
    if (next < 0) {
      throw new BadRequestError("Adjustment would result in negative stock.");
    }

    const history = [
      ...(Array.isArray(existing.history) ? existing.history : []),
      historyEntry(
        "adjustment",
        input.quantityChange,
        actor.displayName,
        input.reason,
        input.notes
      ),
    ];

    const updated = await this.repo.update(id, {
      currentQty: next,
      history,
    });
    if (!updated) throw new NotFoundError("Consumable", id);
    return toDTO(updated);
  }
}
