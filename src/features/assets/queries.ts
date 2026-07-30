import { AssetRepository } from "@/features/assets/repository";
import type { AssetStatus } from "@/features/assets/types";

const assetRepository = new AssetRepository();

export async function listAssets(status?: AssetStatus) {
  return assetRepository.findMany({ status });
}

export async function getAssetById(id: string) {
  return assetRepository.findById(id);
}

export async function getAssetByCode(code: string) {
  return assetRepository.findByCode(code);
}
