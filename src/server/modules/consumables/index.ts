import type { NextRequest } from "next/server";

import { requireAssetOperator, requireActor } from "@/server/shared/auth";
import { created, handleError, ok } from "@/server/shared/http";

import { ConsumableService } from "./consumable.service";

export class ConsumableController {
  constructor(
    private readonly service: ConsumableService = new ConsumableService()
  ) {}

  async list(request: NextRequest | Request) {
    try {
      await requireActor();
      const url = new URL(request.url);
      
      const pageParam = url.searchParams.get("page");
      const limitParam = url.searchParams.get("limit");

      return ok(
        await this.service.list({
          category: url.searchParams.get("category") ?? undefined,
          stockLevel: url.searchParams.get("stockLevel") ?? undefined,
          search: url.searchParams.get("search") ?? undefined,
          page: pageParam ? parseInt(pageParam, 10) : undefined,
          limit: limitParam ? parseInt(limitParam, 10) : undefined,
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

  async create(request: NextRequest | Request) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      return created(await this.service.create(body, session.actor));
    } catch (error) {
      return handleError(error);
    }
  }

  async update(request: NextRequest | Request, id: string) {
    try {
      await requireAssetOperator();
      const body = await request.json();
      return ok(await this.service.update(id, body));
    } catch (error) {
      return handleError(error);
    }
  }

  async restock(request: NextRequest | Request, id: string) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      return ok(await this.service.restock(id, body, session.actor));
    } catch (error) {
      return handleError(error);
    }
  }

  async checkout(request: NextRequest | Request, id: string) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      return ok(await this.service.checkout(id, body, session.actor));
    } catch (error) {
      return handleError(error);
    }
  }

  async issue(request: NextRequest | Request, id: string) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      return ok(await this.service.issue(id, body, session.actor));
    } catch (error) {
      return handleError(error);
    }
  }

  async adjust(request: NextRequest | Request, id: string) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      return ok(await this.service.adjust(id, body, session.actor));
    } catch (error) {
      return handleError(error);
    }
  }

  /** QR scan release from a supplier purchase lot (consumable batch). */
  async releaseFromLot(request: NextRequest | Request) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      return ok(await this.service.releaseFromLot(body, session.actor));
    } catch (error) {
      return handleError(error);
    }
  }
}

export const consumableController = new ConsumableController();
export { ConsumableService } from "./consumable.service";
