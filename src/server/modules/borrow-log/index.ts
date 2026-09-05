import type { NextRequest } from "next/server";

import { requireAssetOperator, requireActor } from "@/server/shared/auth";
import { created, handleError, ok } from "@/server/shared/http";

import { BorrowLogService } from "./borrow-log.service";

export class BorrowLogController {
  constructor(private readonly service: BorrowLogService = new BorrowLogService()) {}

  async list(request: NextRequest | Request) {
    try {
      const session = await requireActor();
      const url = new URL(request.url);
      return ok(
        await this.service.list({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: url.searchParams.get("status") as any ?? undefined,
          department: url.searchParams.get("department") ?? undefined,
          search: url.searchParams.get("search") ?? undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
          custodyKind: (url.searchParams.get("custodyKind") || url.searchParams.get("custody") || url.searchParams.get("type")) as any ?? undefined,
        }, session)
      );
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
