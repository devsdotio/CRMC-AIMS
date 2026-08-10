import type { NextRequest } from "next/server";

import { requireAssetOperator } from "@/server/shared/auth";
import { created, handleError, ok } from "@/server/shared/http";

import { SupplierService } from "./supplier.service";

export class SupplierController {
  constructor(
    private readonly service: SupplierService = new SupplierService()
  ) {}

  async list(request: NextRequest | Request) {
    try {
      await requireAssetOperator();
      const url = new URL(request.url);
      return ok(
        await this.service.list({
          search: url.searchParams.get("search") ?? undefined,
          status: url.searchParams.get("status") ?? undefined,
          activeOnly: url.searchParams.get("activeOnly") ?? undefined,
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

  async deactivate(id: string) {
    try {
      await requireAssetOperator();
      return ok(await this.service.deactivate(id));
    } catch (error) {
      return handleError(error);
    }
  }
}

export const supplierController = new SupplierController();
export { SupplierService } from "./supplier.service";
export { SupplierRepository } from "./supplier.repository";
