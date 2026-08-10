import type { PurchaseLotRow } from "@/server/db/schema";
import type { DbSession } from "@/server/db/transaction";
import { generateOperationalCode } from "@/server/shared/codes";
import { BadRequestError, NotFoundError } from "@/server/shared/errors";
import { SupplierRepository } from "@/server/modules/suppliers/supplier.repository";

import { PurchaseLotRepository } from "./purchase-lot.repository";
import type {
  CreatePurchaseLotInput,
  PurchaseLotDTO,
} from "./purchase-lot.types";
import {
  listPurchaseLotsQuerySchema,
  purchaseLotIdSchema,
} from "./purchase-lot.validation";

function formatMoney(value: string | number): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

export function toPurchaseLotDTO(row: PurchaseLotRow): PurchaseLotDTO {
  return {
    id: row.id,
    lotCode: row.lotCode,
    itemType: row.itemType,
    consumableId: row.consumableId ?? null,
    assetId: row.assetId ?? null,
    itemCode: row.itemCode,
    itemName: row.itemName,
    supplierId: row.supplierId ?? null,
    supplierName: row.supplierName ?? null,
    quantity: row.quantity,
    quantityRemaining: row.quantityRemaining,
    unitCost: formatMoney(row.unitCost),
    totalCost: formatMoney(row.totalCost),
    purchasedOn: row.purchasedOn,
    reference: row.reference ?? null,
    notes: row.notes ?? null,
    recordedByUserId: row.recordedByUserId,
    recordedByName: row.recordedByName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Shared write path for consumable restocks and asset acquisitions.
 */
export class PurchaseLotService {
  constructor(
    private readonly repo = new PurchaseLotRepository(),
    private readonly suppliers = new SupplierRepository()
  ) {}

  async list(rawQuery: unknown): Promise<PurchaseLotDTO[]> {
    const filters = listPurchaseLotsQuerySchema.parse(rawQuery ?? {});
    const rows = await this.repo.list(filters);
    return rows.map(toPurchaseLotDTO);
  }

  async getById(rawId: string): Promise<PurchaseLotDTO> {
    const id = purchaseLotIdSchema.parse(rawId);
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError("Purchase lot", id);
    return toPurchaseLotDTO(row);
  }

  /**
   * Resolves optional supplierId → name snapshot, then inserts the lot.
   */
  async recordLot(
    input: CreatePurchaseLotInput,
    session?: DbSession
  ): Promise<PurchaseLotDTO> {
    let supplierName = input.supplierName ?? null;
    let supplierId = input.supplierId ?? null;

    if (supplierId) {
      const supplier = await this.suppliers.findById(supplierId, session);
      if (!supplier) {
        throw new NotFoundError("Supplier", supplierId);
      }
      if (supplier.status !== "active") {
        throw new BadRequestError(
          "Selected supplier is inactive. Choose an active vendor."
        );
      }
      supplierName = supplier.name;
    }

    const unitCost = formatMoney(input.unitCost);
    const total = formatMoney(Number(unitCost) * input.quantity);

    const row = await this.repo.create(
      {
        lotCode: generateOperationalCode("LOT"),
        itemType: input.itemType,
        consumableId: input.consumableId ?? null,
        assetId: input.assetId ?? null,
        itemCode: input.itemCode,
        itemName: input.itemName,
        supplierId,
        supplierName,
        quantity: input.quantity,
        quantityRemaining: input.quantity,
        unitCost,
        totalCost: total,
        purchasedOn: input.purchasedOn,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        recordedByUserId: input.recordedByUserId,
        recordedByName: input.recordedByName,
      },
      session
    );

    return toPurchaseLotDTO(row);
  }
}
