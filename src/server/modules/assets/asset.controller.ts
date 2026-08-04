import type { NextRequest } from "next/server";

import {
  created,
  handleError,
  noContent,
  ok,
} from "@/server/shared/http";

import { AssetService } from "./asset.service";

/**
 * Thin HTTP adapter. Parses/request shape only — business rules live in
 * AssetService. Response envelope matches `features/assets/client/assets-api.ts`
 * so hooks integrate without client changes.
 */
export class AssetController {
  constructor(private readonly assetService: AssetService = new AssetService()) {}

  async listAssets(request: NextRequest | Request) {
    try {
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
      const body = await request.json();
      const data = await this.assetService.createAsset(body);
      return created(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async getAsset(id: string) {
    try {
      const data = await this.assetService.getAssetById(id);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async updateAsset(request: NextRequest | Request, id: string) {
    try {
      const body = await request.json();
      const data = await this.assetService.updateAsset(id, body);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async deleteAsset(id: string) {
    try {
      await this.assetService.deleteAsset(id);
      return noContent();
    } catch (error) {
      return handleError(error);
    }
  }

  async releaseAsset(id: string) {
    try {
      const data = await this.assetService.releaseAsset(id);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }

  async returnAsset(request: NextRequest | Request, id: string) {
    try {
      const body = await request.json();
      const data = await this.assetService.returnAsset(id, body);
      return ok(data);
    } catch (error) {
      return handleError(error);
    }
  }
}

/** Shared singleton for route handlers. */
export const assetController = new AssetController();
