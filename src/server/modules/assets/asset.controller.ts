import type { NextRequest } from "next/server";
import { created, handleError, noContent, ok } from "@/server/shared/http";
import { AssetService } from "./asset.service";

/**
 * Controller layer: parses the request, delegates to the service, and
 * shapes the HTTP response. No business rules live here — if you find
 * yourself writing an `if` that decides *what should happen*, it belongs
 * in `AssetService` instead.
 */
export class AssetController {
  constructor(private readonly assetService: AssetService = new AssetService()) {}

  async createAsset(request: NextRequest) {
    try {
      const body = await request.json();
      const asset = await this.assetService.createAsset(body);
      return created(asset);
    } catch (error) {
      return handleError(error);
    }
  }

  async getAsset(id: string) {
    try {
      const asset = await this.assetService.getAssetById(id);
      return ok(asset);
    } catch (error) {
      return handleError(error);
    }
  }

  async getAssets(request: NextRequest) {
    try {
      const includeArchived =
        request.nextUrl.searchParams.get("includeArchived") === "true";
      const assets = await this.assetService.getAssets(includeArchived);
      return ok(assets);
    } catch (error) {
      return handleError(error);
    }
  }

  async updateAsset(request: NextRequest, id: string) {
    try {
      const body = await request.json();
      const asset = await this.assetService.updateAsset(id, body);
      return ok(asset);
    } catch (error) {
      return handleError(error);
    }
  }

  async archiveAsset(id: string) {
    try {
      const asset = await this.assetService.archiveAsset(id);
      return ok(asset);
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

  async searchAssets(request: NextRequest) {
    try {
      const params = Object.fromEntries(request.nextUrl.searchParams.entries());
      const result = await this.assetService.searchAssets(params);
      return ok(result);
    } catch (error) {
      return handleError(error);
    }
  }
}
