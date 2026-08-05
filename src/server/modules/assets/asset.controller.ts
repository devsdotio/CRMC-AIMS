import type { NextRequest } from "next/server";

import { requireAssetOperator } from "@/server/shared/auth";
import {
  created,
  handleError,
  noContent,
  ok,
} from "@/server/shared/http";

import { AssetService } from "./asset.service";

/**
 * Thin HTTP adapter. Asset operators = superadmin | admin | staff.
 * Actor/role always taken from verified session + profiles row.
 */
export class AssetController {
  constructor(private readonly assetService: AssetService = new AssetService()) {}

  async listAssets(request: NextRequest | Request) {
    try {
      await requireAssetOperator();
      const url = new URL(request.url);
      const status = url.searchParams.get("status") ?? undefined;
      const data = await this.assetService.listAssets({ status });
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async createAsset(request: NextRequest | Request) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      const data = await this.assetService.createAsset(body, session.actor);
      return created(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async getAsset(id: string) {
    try {
      await requireAssetOperator();
      const data = await this.assetService.getAssetById(id);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async updateAsset(request: NextRequest | Request, id: string) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      const data = await this.assetService.updateAsset(id, body, session.actor);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async deleteAsset(id: string) {
    try {
      const session = await requireAssetOperator();
      await this.assetService.deleteAsset(id, session.actor);
      return noContent();
    } catch (error) {
      return handleError(error);
    }
  }

  async releaseAsset(request: NextRequest | Request, id: string) {
    try {
      const session = await requireAssetOperator();
      let body: unknown = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      const data = await this.assetService.releaseAsset(id, body, session.actor);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async returnAsset(request: NextRequest | Request, id: string) {
    try {
      const session = await requireAssetOperator();
      const body = await request.json();
      const data = await this.assetService.returnAsset(id, body, session.actor);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async flagForMaintenance(request: NextRequest | Request, id: string) {
    try {
      const session = await requireAssetOperator();
      let body: unknown = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      const data = await this.assetService.flagForMaintenance(
        id,
        body,
        session.actor
      );
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async listLifecycle(request: NextRequest | Request, id: string) {
    try {
      await requireAssetOperator();
      const url = new URL(request.url);
      const limitRaw = url.searchParams.get("limit");
      const limit = limitRaw ? Number(limitRaw) : undefined;
      const data = await this.assetService.listLifecycle(
        id,
        Number.isFinite(limit) ? limit : undefined
      );
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }
}

/** Shared singleton for route handlers. */
export const assetController = new AssetController();
