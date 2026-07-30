"use server";

import { AssetService } from "@/features/assets/service";
import type { CreateAssetInput, ReturnAssetInput, UpdateAssetInput } from "@/features/assets/types";

const assetService = new AssetService();

export async function createAsset(input: CreateAssetInput) {
  return assetService.createAsset(input);
}

export async function updateAsset(id: string, input: UpdateAssetInput) {
  return assetService.updateAsset(id, input);
}

export async function deleteAsset(id: string) {
  await assetService.deleteAsset(id);
  return true;
}

export async function releaseAsset(id: string) {
  return assetService.releaseAsset(id);
}

export async function returnAsset(id: string, input: ReturnAssetInput) {
  return assetService.returnAsset(id, input);
}
