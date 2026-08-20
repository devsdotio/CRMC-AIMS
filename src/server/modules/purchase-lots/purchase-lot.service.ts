import type { PurchaseLotRow } from "@/server/db/schema";
import type { DbSession } from "@/server/db/transaction";
import { generateOperationalCode } from "@/server/shared/codes";
import {
  BadRequestError,
  NotFoundError,
} from "@/server/shared/errors";
import { encodeLotQr, parseScanPayload } from "@/server/shared/qr";
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

export type LotCostAllocation = {
  lotId: string | null;
  lotCode: string | null;
  quantity: number;
  unitCost: string;
  total: string;
  supplierId?: string | null;
  supplierName?: string | null;
  uncosted?: boolean;
};

export function derivePONumber(lotCode: string, reference?: string | null): string {
  if (reference && reference.trim().toUpperCase().startsWith("PO-")) {
    return reference.trim();
  }
  return lotCode.startsWith("LOT-")
    ? lotCode.replace(/^LOT-/, "PO-")
    : lotCode.startsWith("PO-")
    ? lotCode
    : `PO-${lotCode}`;
}

export function deriveLotCode(lotCode: string): string {
  return lotCode.startsWith("PO-") ? lotCode.replace(/^PO-/, "LOT-") : lotCode;
}

export function toPurchaseLotDTO(row: PurchaseLotRow): PurchaseLotDTO {
  const poNumber = derivePONumber(row.lotCode, row.reference);
  const lotCode = deriveLotCode(row.lotCode);
  return {
    id: row.id,
    poNumber,
    lotCode,
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
    qrPayload: encodeLotQr(lotCode),
  };
}

/**
 * Shared write path for consumable restocks and asset acquisitions.
 * Also owns lot draw-down (specific lot or FIFO) so checkout can freeze costs.
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

  async getByCode(rawCode: string): Promise<PurchaseLotDTO> {
    const parsed = parseScanPayload(rawCode);
    if (!parsed.code) {
      throw new BadRequestError("Lot code is required.");
    }
    const row = await this.repo.findByLotCode(parsed.code);
    if (!row) throw new NotFoundError("Purchase lot", parsed.code);
    return toPurchaseLotDTO(row);
  }

  /** Exposed for project FIFO / repo-level callers. */
  listAvailableForConsumableFifo(
    consumableId: string,
    session: DbSession
  ) {
    return this.repo.listAvailableForConsumableFifo(consumableId, session);
  }

  updateRemaining(
    id: string,
    quantityRemaining: number,
    session?: DbSession
  ) {
    return this.repo.updateRemaining(id, quantityRemaining, session);
  }

  /**
   * Draw quantity from a single lot (QR scan path for multi-supplier pricing).
   * Returns DTO + allocation snapshot for history / expense reporting.
   */
  async consumeFromLot(
    lotCode: string,
    quantity: number,
    session: DbSession,
    expectedConsumableId?: string
  ): Promise<{ lot: PurchaseLotDTO; allocation: LotCostAllocation }> {
    if (quantity <= 0) {
      throw new BadRequestError("quantity must be positive.");
    }

    const lot = await this.repo.findByLotCodeForUpdate(lotCode, session);
    if (!lot) {
      throw new NotFoundError("Purchase lot", lotCode);
    }

    return this.drawFromLockedLot(lot, quantity, session, expectedConsumableId);
  }

  /** Same as consumeFromLot but keyed by lot id. */
  async consumeFromLotId(
    lotId: string,
    quantity: number,
    session: DbSession,
    expectedConsumableId?: string
  ): Promise<{ lot: PurchaseLotDTO; allocation: LotCostAllocation }> {
    if (quantity <= 0) {
      throw new BadRequestError("quantity must be positive.");
    }

    const lot = await this.repo.findByIdForUpdate(lotId, session);
    if (!lot) {
      throw new NotFoundError("Purchase lot", lotId);
    }

    return this.drawFromLockedLot(lot, quantity, session, expectedConsumableId);
  }

  private async drawFromLockedLot(
    lot: PurchaseLotRow,
    quantity: number,
    session: DbSession,
    expectedConsumableId?: string
  ): Promise<{ lot: PurchaseLotDTO; allocation: LotCostAllocation }> {
    if (lot.itemType !== "consumable") {
      throw new BadRequestError(
        "Only consumable purchase lots support quantity release via scan."
      );
    }

    if (
      expectedConsumableId &&
      lot.consumableId &&
      lot.consumableId !== expectedConsumableId
    ) {
      throw new BadRequestError(
        `Lot ${lot.lotCode} does not belong to this consumable item.`
      );
    }

    if (lot.quantityRemaining < quantity) {
      throw new BadRequestError(
        `Insufficient remaining in lot ${lot.lotCode}. Available: ${lot.quantityRemaining}.`
      );
    }

    await this.repo.updateRemaining(
      lot.id,
      lot.quantityRemaining - quantity,
      session
    );

    const unit = Number(lot.unitCost);
    const total = unit * quantity;
    const allocation: LotCostAllocation = {
      lotId: lot.id,
      lotCode: lot.lotCode,
      quantity,
      unitCost: formatMoney(unit),
      total: formatMoney(total),
      supplierId: lot.supplierId,
      supplierName: lot.supplierName,
    };

    const refreshed = await this.repo.findById(lot.id, session);
    return {
      lot: toPurchaseLotDTO(refreshed ?? lot),
      allocation,
    };
  }

  /**
   * Attach found / correction stock onto an existing lot (increase remaining).
   */
  async addToLot(
    opts: { lotId?: string; lotCode?: string },
    quantity: number,
    session: DbSession,
    expectedConsumableId?: string
  ): Promise<{ lot: PurchaseLotDTO; allocation: LotCostAllocation }> {
    if (quantity <= 0) {
      throw new BadRequestError("quantity must be positive.");
    }

    let lot: PurchaseLotRow | null = null;
    if (opts.lotId) {
      lot = await this.repo.findByIdForUpdate(opts.lotId, session);
    } else if (opts.lotCode) {
      lot = await this.repo.findByLotCodeForUpdate(opts.lotCode, session);
    } else {
      throw new BadRequestError("lotId or lotCode is required.");
    }

    if (!lot) {
      throw new NotFoundError(
        "Purchase lot",
        opts.lotId ?? opts.lotCode ?? ""
      );
    }

    if (lot.itemType !== "consumable") {
      throw new BadRequestError(
        "Only consumable purchase lots support quantity adjustments."
      );
    }

    if (
      expectedConsumableId &&
      lot.consumableId &&
      lot.consumableId !== expectedConsumableId
    ) {
      throw new BadRequestError(
        `Lot ${lot.lotCode} does not belong to this consumable item.`
      );
    }

    const nextQty = lot.quantity + quantity;
    const nextRemaining = lot.quantityRemaining + quantity;
    await this.repo.updateQuantities(lot.id, nextQty, nextRemaining, session);

    const unit = Number(lot.unitCost);
    const allocation: LotCostAllocation = {
      lotId: lot.id,
      lotCode: lot.lotCode,
      quantity,
      unitCost: formatMoney(unit),
      total: formatMoney(unit * quantity),
      supplierId: lot.supplierId,
      supplierName: lot.supplierName,
    };

    const refreshed = await this.repo.findById(lot.id, session);
    return {
      lot: toPurchaseLotDTO(refreshed ?? lot),
      allocation,
    };
  }

  /**
   * FIFO draw across available lots for a consumable (generic checkout).
   * Uncosted remainder is recorded if no lot qty remains (legacy stock).
   */
  async consumeFifo(
    consumableId: string,
    quantity: number,
    session: DbSession
  ): Promise<LotCostAllocation[]> {
    if (quantity <= 0) {
      throw new BadRequestError("quantity must be positive.");
    }

    let remaining = quantity;
    const allocations: LotCostAllocation[] = [];
    const available = await this.repo.listAvailableForConsumableFifo(
      consumableId,
      session
    );

    for (const lot of available) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, lot.quantityRemaining);
      if (take <= 0) continue;

      const unit = Number(lot.unitCost);
      const lineTotal = unit * take;
      allocations.push({
        lotId: lot.id,
        lotCode: lot.lotCode,
        quantity: take,
        unitCost: formatMoney(unit),
        total: formatMoney(lineTotal),
        supplierId: lot.supplierId,
        supplierName: lot.supplierName,
      });

      await this.repo.updateRemaining(
        lot.id,
        lot.quantityRemaining - take,
        session
      );
      remaining -= take;
    }

    if (remaining > 0) {
      allocations.push({
        lotId: null,
        lotCode: null,
        quantity: remaining,
        unitCost: "0.00",
        total: "0.00",
        uncosted: true,
      });
    }

    return allocations;
  }

  /**
   * Resolves optional supplierId → name snapshot, then inserts the lot.
   */
  async recordLot(
    input: CreatePurchaseLotInput,
    session?: DbSession
  ): Promise<PurchaseLotDTO> {
    let supplierName = input.supplierName ?? null;
    const supplierId = input.supplierId ?? null;

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
        lotCode: generateOperationalCode("PO"),
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
