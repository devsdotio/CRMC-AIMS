import type { NextRequest } from "next/server";

import { requireActor, requireAssetOperator } from "@/server/shared/auth";
import { handleError, ok } from "@/server/shared/http";
import { ConsumableService } from "@/server/modules/consumables/consumable.service";

import { PurchaseLotService } from "./purchase-lot.service";

export class PurchaseLotController {
  constructor(
    private readonly service: PurchaseLotService = new PurchaseLotService(),
    private readonly consumables: ConsumableService = new ConsumableService()
  ) {}

  async list(request: NextRequest | Request) {
    try {
      await requireActor();
      const url = new URL(request.url);
      return ok(
        await this.service.list({
          consumableId: url.searchParams.get("consumableId") ?? undefined,
          assetId: url.searchParams.get("assetId") ?? undefined,
          supplierId: url.searchParams.get("supplierId") ?? undefined,
          itemType: url.searchParams.get("itemType") ?? undefined,
          search: url.searchParams.get("search") ?? undefined,
        })
      );
    } catch (error) {
      return handleError(error);
    }
  }

  async get(id: string) {
    try {
      await requireActor();
      return ok(await this.service.getById(id));
    } catch (error) {
      return handleError(error);
    }
  }

  async getByCode(request: NextRequest | Request) {
    try {
      await requireActor();
      const url = new URL(request.url);
      const code = url.searchParams.get("code") ?? "";
      return ok(await this.service.getByCode(code));
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Scan lot QR → enter qty → cost-snapshot checkout on the linked consumable.
   * Delegates to ConsumableService so stock + history stay in one place.
   */
  async scanRelease(request: NextRequest | Request) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      return ok(
        await this.consumables.releaseFromLot(body, session.actor)
      );
    } catch (error) {
      return handleError(error);
    }
  }
}

export const purchaseLotController = new PurchaseLotController();
export { PurchaseLotService } from "./purchase-lot.service";
export type { LotCostAllocation } from "./purchase-lot.service";
export { PurchaseLotRepository } from "./purchase-lot.repository";
export { toPurchaseLotDTO } from "./purchase-lot.service";
