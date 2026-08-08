import type { NextRequest } from "next/server";

import { requireAssetOperator } from "@/server/shared/auth";
import { created, handleError, ok } from "@/server/shared/http";

import { BorrowLogService } from "./borrow-log.service";

export class BorrowLogController {
  constructor(private readonly service: BorrowLogService = new BorrowLogService()) {}

  async list(request: NextRequest | Request) {
    try {
      await requireAssetOperator();
      const url = new URL(request.url);
      return ok(
        await this.service.list({
          status: url.searchParams.get("status") ?? undefined,
          department: url.searchParams.get("department") ?? undefined,
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

  async release(request: NextRequest | Request) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      return created(await this.service.release(body, session.actor));
    } catch (error) {
      return handleError(error);
    }
  }

  async returnLog(request: NextRequest | Request, id: string) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      return ok(await this.service.returnLog(id, body, session.actor));
    } catch (error) {
      return handleError(error);
    }
  }
}

export const borrowLogController = new BorrowLogController();
export { BorrowLogService } from "./borrow-log.service";
