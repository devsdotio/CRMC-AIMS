import type { NextRequest } from "next/server";

import { requireActor, requireUser } from "@/server/shared/auth";
import {
  created,
  handleError,
  noContent,
  ok,
} from "@/server/shared/http";

import { AssetService } from "./asset.service";

/**
 * Thin HTTP adapter. Parses/request shape only — business rules live in
 * AssetService. Actor is always taken from the verified session for mutations.
 */
export class AssetController {
  constructor(private readonly assetService: AssetService = new AssetService()) {}

  async listAssets(request: NextRequest | Request) {
    try {
      await requireUser();
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
      const actor = await requireActor();
      const body = await request.json();
      const data = await this.assetService.createAsset(body, actor);
      return created(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async getAsset(id: string) {
    try {
      await requireUser();
      const data = await this.assetService.getAssetById(id);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async updateAsset(request: NextRequest | Request, id: string) {
    try {
      const actor = await requireActor();
      const body = await request.json();
      const data = await this.assetService.updateAsset(id, body, actor);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async deleteAsset(id: string) {
    try {
      const actor = await requireActor();
      await this.assetService.deleteAsset(id, actor);
      return noContent();
    } catch (error) {
      return handleError(error);
    }
  }

  async releaseAsset(request: NextRequest | Request, id: string) {
    try {
      const actor = await requireActor();
      let body: unknown = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      const data = await this.assetService.releaseAsset(id, body, actor);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async returnAsset(request: NextRequest | Request, id: string) {
    try {
      const actor = await requireActor();
      const body = await request.json();
      const data = await this.assetService.returnAsset(id, body, actor);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async flagForMaintenance(request: NextRequest | Request, id: string) {
    try {
      const actor = await requireActor();
      let body: unknown = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      const data = await this.assetService.flagForMaintenance(id, body, actor);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async listLifecycle(request: NextRequest | Request, id: string) {
    try {
      await requireUser();
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
