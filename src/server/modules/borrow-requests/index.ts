import type { NextRequest } from "next/server";

import { requireAssetOperator, requireActor } from "@/server/shared/auth";
import { created, handleError, ok } from "@/server/shared/http";

import { BorrowRequestService } from "./borrow-request.service";

export class BorrowRequestController {
  constructor(
    private readonly service: BorrowRequestService = new BorrowRequestService()
  ) {}

  async list(request: NextRequest | Request) {
    try {
      const session = await requireActor();
      const url = new URL(request.url);
      const data = await this.service.list({
        status: url.searchParams.get("status") ?? undefined,
        department: url.searchParams.get("department") ?? undefined,
        search: url.searchParams.get("search") ?? undefined,
      }, session);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async get(id: string) {
    try {
      const session = await requireActor();
      return ok(await this.service.getById(id, session));
    } catch (error) {
      return handleError(error);
    }
  }

  async create(request: NextRequest | Request) {
    try {
      const session = await requireActor();
      const body = await request.json();
      return created(await this.service.create(body, session));
    } catch (error) {
      return handleError(error);
    }
  }

  async approve(request: NextRequest | Request, id: string) {
    try {
      const session = await requireAssetOperator();
      let body: unknown = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      return ok(await this.service.approve(id, body, session.actor));
    } catch (error) {
      return handleError(error);
    }
  }

  async reject(request: NextRequest | Request, id: string) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      return ok(await this.service.reject(id, body, session.actor));
    } catch (error) {
      return handleError(error);
    }
  }
}

export const borrowRequestController = new BorrowRequestController();
