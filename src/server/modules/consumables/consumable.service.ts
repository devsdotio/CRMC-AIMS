import type { ConsumableRow, StockHistoryEntry } from "@/server/db/schema";
import {
  generateOperationalCode,
  todayDateString,
} from "@/server/shared/codes";
import type { ActorContext } from "@/server/shared/auth";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";
import { withTransaction } from "@/server/db/transaction";
import { PurchaseLotService } from "@/server/modules/purchase-lots/purchase-lot.service";
import { CategoryRepository } from "@/server/modules/categories/category.repository";

import { ConsumableRepository } from "./consumable.repository";
import type { ConsumableDTO } from "./consumable.types";
import {
  consumableIdSchema,
  createConsumableSchema,
  listConsumablesQuerySchema,
  restockSchema,
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
  notes?: string,
  extra?: Partial<
    Pick<
      StockHistoryEntry,
      "unitCost" | "supplierId" | "supplierName" | "lotCode"
    >
  >
): StockHistoryEntry {
  return {
    id: crypto.randomUUID(),
    date: todayDateString(),
    type,
    quantityChange,
    actor,
    ...(reason ? { reason } : {}),
    ...(notes ? { notes } : {}),
    ...extra,
  };
}

export class ConsumableService {
  constructor(
    private readonly repo = new ConsumableRepository(),
    private readonly purchaseLots = new PurchaseLotService(),
    private readonly taxonomy = new CategoryRepository()
  ) {}

  private async resolveConsumableCategoryName(rawName: string): Promise<string> {
    const found = await this.taxonomy.findByTypeAndName("consumable", rawName);
    if (!found) {
      throw new BadRequestError(
        `Unknown consumable category “${rawName}”. Add it under Settings → Categories first.`
      );
    }
    return found.name;
  }

  async list(rawQuery: unknown): Promise<import("@/types/filters").PaginatedResponse<ConsumableDTO>> {
    const filters = listConsumablesQuerySchema.parse(rawQuery ?? {});
    const result = await this.repo.list({
      category: filters.category,
      search: filters.search,
      stockLevel: filters.stockLevel === "critical" ? "critical" : undefined,
      page: filters.page,
      limit: filters.limit,
    });

    let dtos = result.data.map(toDTO);

    if (filters.stockLevel && filters.stockLevel !== "all") {
      dtos = dtos.filter((row) => {
        const severity = getStockSeverity(row.currentQty, row.minThreshold);
        if (filters.stockLevel === "healthy") return severity === "healthy";
        if (filters.stockLevel === "low") return severity === "low";
        if (filters.stockLevel === "critical") return severity === "critical";
        return true;
      });
    }

    return {
      ...result,
      data: dtos,
    };
  }

  async getById(rawId: string): Promise<ConsumableDTO> {
    const id = consumableIdSchema.parse(rawId);
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError("Consumable", id);
    return toDTO(row);
  }

  async create(rawInput: unknown, actor: ActorContext): Promise<ConsumableDTO> {
    const input = createConsumableSchema.parse(rawInput);
    const itemCode = input.itemCode?.trim() || generateOperationalCode("CON");
    const categoryName = await this.resolveConsumableCategoryName(input.category);

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
      category: categoryName,
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

    let categoryName: string | undefined;
    if (input.category !== undefined) {
      categoryName = await this.resolveConsumableCategoryName(input.category);
    }

    const updated = await this.repo.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(categoryName !== undefined ? { category: categoryName } : {}),
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
    const input = restockSchema.parse(rawInput);

    return withTransaction(async (tx) => {
      const existing = await this.repo.findByIdForUpdate(id, tx);
      if (!existing) throw new NotFoundError("Consumable", id);

      const purchasedOn = input.purchasedOn ?? todayDateString();
      const lot = await this.purchaseLots.recordLot(
        {
          itemType: "consumable",
          consumableId: existing.id,
          itemCode: existing.itemCode,
          itemName: existing.name,
          supplierId: input.supplierId ?? null,
          quantity: input.quantity,
          unitCost: input.unitCost,
          purchasedOn,
          reference: input.reason ?? null,
          notes: input.notes ?? null,
          recordedByUserId: actor.userId,
          recordedByName: actor.displayName,
        },
        tx
      );

      const history = [
        ...(Array.isArray(existing.history) ? existing.history : []),
        historyEntry(
          "restock",
          input.quantity,
          actor.displayName,
          input.reason,
          input.notes,
          {
            unitCost: lot.unitCost,
            supplierId: lot.supplierId ?? undefined,
            supplierName: lot.supplierName ?? undefined,
            lotCode: lot.lotCode,
          }
        ),
      ];

      const updated = await this.repo.update(
        id,
        {
          currentQty: existing.currentQty + input.quantity,
          lastRestocked: new Date(),
          history,
          ...(lot.supplierName ? { supplier: lot.supplierName } : {}),
        },
        tx
      );
      if (!updated) throw new NotFoundError("Consumable", id);
      return toDTO(updated);
    });
  }

  async checkout(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ConsumableDTO> {
    const id = consumableIdSchema.parse(rawId);
    const input = stockMovementSchema.parse(rawInput);

    return withTransaction(async (tx) => {
      const existing = await this.repo.findByIdForUpdate(id, tx);
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

      const updated = await this.repo.update(
        id,
        {
          currentQty: existing.currentQty - input.quantity,
          history,
        },
        tx
      );
      if (!updated) throw new NotFoundError("Consumable", id);
      return toDTO(updated);
    });
  }

  async adjust(
    rawId: string,
    rawInput: unknown,
    actor: ActorContext
  ): Promise<ConsumableDTO> {
    const id = consumableIdSchema.parse(rawId);
    const input = stockAdjustSchema.parse(rawInput);

    return withTransaction(async (tx) => {
      const existing = await this.repo.findByIdForUpdate(id, tx);
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

      const updated = await this.repo.update(
        id,
        { currentQty: next, history },
        tx
      );
      if (!updated) throw new NotFoundError("Consumable", id);
      return toDTO(updated);
    });
  }
}
