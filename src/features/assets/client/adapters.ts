import type { Asset as UiAsset, AssetCategory, AssetStatus as UiAssetStatus } from "@/components/assets/types";
import type { Asset as BackendAsset } from "@/features/assets/types";

function mapBackendStatusToUi(status: BackendAsset["status"]): UiAssetStatus {
  if (status === "under_repair") {
    return "needs_repair";
  }

  return "active";
}

function mapBackendCategoryToUi(category: string): AssetCategory {
  const normalized = category.trim().toLowerCase();

  if (normalized.includes("vehicle") || normalized.includes("transport")) {
    return "transport";
  }

  if (normalized.includes("audio") || normalized.includes("video") || normalized.includes("av")) {
    return "av";
  }

  if (normalized.includes("furniture")) {
    return "furniture";
  }

  return "computing";
}

export function mapBackendAssetToUiAsset(asset: BackendAsset): UiAsset {
  return {
    id: asset.id,
    assetCode: asset.code,
    name: asset.name,
    category: mapBackendCategoryToUi(asset.category),
    status: mapBackendStatusToUi(asset.status),
    serialNumber: undefined,
    location: "Unassigned Location",
    currentHolder: asset.status === "borrowed" ? "Borrowed" : undefined,
    department: undefined,
    purchaseDate: undefined,
    value: undefined,
    imageUrl: undefined,
    notes: asset.condition,
    lastUpdated: new Date(asset.createdAt).toISOString().split("T")[0],
    maintenanceHistory: [],
  };
}
