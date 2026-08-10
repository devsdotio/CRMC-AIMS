import type { NextRequest } from "next/server";

import { requireAssetOperator } from "@/server/shared/auth";
import { handleError, ok } from "@/server/shared/http";

import { PurchaseLotService } from "./purchase-lot.service";

export class PurchaseLotController {
  constructor(
    private readonly service: PurchaseLotService = new PurchaseLotService()
  ) {}

  async list(request: NextRequest | Request) {
    try {
      await requireAssetOperator();
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
      await requireAssetOperator();
      return ok(await this.service.getById(id));
    } catch (error) {
      return handleError(error);
    }
  }
}

export const purchaseLotController = new PurchaseLotController();
export { PurchaseLotService } from "./purchase-lot.service";
export { PurchaseLotRepository } from "./purchase-lot.repository";
export { toPurchaseLotDTO } from "./purchase-lot.service";
