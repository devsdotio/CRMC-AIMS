import type { NextRequest } from "next/server";

import { requireUserManager } from "@/server/shared/auth";
import { created, handleError, ok } from "@/server/shared/http";

import { DepartmentService } from "./department.service";

export class DepartmentController {
  constructor(
    private readonly service: DepartmentService = new DepartmentService()
  ) {}

  async list(request: NextRequest | Request) {
    try {
      await requireUserManager();
      const url = new URL(request.url);
      return ok(
        await this.service.list({
          search: url.searchParams.get("search") ?? undefined,
        })
      );
    } catch (error) {
      return handleError(error);
    }
  }

  async get(id: string) {
    try {
      await requireUserManager();
      return ok(await this.service.getById(id));
    } catch (error) {
      return handleError(error);
    }
  }

  async create(request: NextRequest | Request) {
    try {
      await requireUserManager();
      const body = await request.json();
      return created(await this.service.create(body));
    } catch (error) {
      return handleError(error);
    }
  }

  async update(request: NextRequest | Request, id: string) {
    try {
      await requireUserManager();
      const body = await request.json();
      return ok(await this.service.update(id, body));
    } catch (error) {
      return handleError(error);
    }
  }

  async delete(id: string) {
    try {
      await requireUserManager();
      return ok(await this.service.delete(id));
    } catch (error) {
      return handleError(error);
    }
  }
}

export const departmentController = new DepartmentController();
