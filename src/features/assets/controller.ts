import { NextResponse } from "next/server";

import { isAppError } from "@/features/assets/errors";
import { AssetService } from "@/features/assets/service";
import {
  parseAssetId,
  parseAssetListStatusQuery,
  parseCreateAssetInput,
  parseReturnAssetInput,
  parseUpdateAssetInput,
} from "@/features/assets/validators";

const assetService = new AssetService();

export const assetController = {
  async listAssets(request: Request) {
    const url = new URL(request.url);
    const status = parseAssetListStatusQuery(url.searchParams.get("status"));
    const data = await assetService.listAssets({ status });
    return NextResponse.json({ data });
  },

  async createAsset(requestBody: unknown) {
    const input = parseCreateAssetInput(requestBody);
    const data = await assetService.createAsset(input);
    return NextResponse.json({ data }, { status: 201 });
  },

  async getAssetById(id: string) {
    const normalizedId = parseAssetId(id);
    const data = await assetService.getAssetById(normalizedId);
    return NextResponse.json({ data });
  },

  async updateAsset(id: string, requestBody: unknown) {
    const normalizedId = parseAssetId(id);
    const input = parseUpdateAssetInput(requestBody);
    const data = await assetService.updateAsset(normalizedId, input);
    return NextResponse.json({ data });
  },

  async deleteAsset(id: string) {
    const normalizedId = parseAssetId(id);
    await assetService.deleteAsset(normalizedId);
    return new NextResponse(null, { status: 204 });
  },

  async releaseAsset(id: string) {
    const normalizedId = parseAssetId(id);
    const data = await assetService.releaseAsset(normalizedId);
    return NextResponse.json({ data });
  },

  async returnAsset(id: string, requestBody: unknown) {
    const normalizedId = parseAssetId(id);
    const input = parseReturnAssetInput(requestBody);
    const data = await assetService.returnAsset(normalizedId, input);
    return NextResponse.json({ data });
  },
};

export function handleAssetControllerError(error: unknown) {
  if (isAppError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ error: message }, { status: 500 });
}
