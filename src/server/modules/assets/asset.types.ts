import type {
  Asset,
  AssetCategory,
  AssetStatus,
  CreateAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
} from "@/types/assets";
import type { AssetRow, NewAssetRow } from "@/server/db/schema";
import { encodeAssetQr } from "@/server/shared/qr";

export type {
  Asset,
  AssetCategory,
  AssetStatus,
  CreateAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
};

import type { PaginationParams } from "@/types/filters";

/**
 * List filters supported by GET /api/assets.
 */
export interface ListAssetsFilters extends PaginationParams {
  status?: AssetStatus;
  modelId?: string;
  category?: string;
  search?: string;
  /** When true, only units with no current holder. */
  availableOnly?: boolean;
}

/**
 * Asset API DTO with QR + model link for scanners and multi-unit catalog.
 */
export type AssetDTOWithMeta = Asset & {
  modelId?: string;
  qrPayload: string;
};

export function withAssetMeta(asset: Asset & { modelId?: string | null }): AssetDTOWithMeta {
  return {
    ...asset,
    modelId: asset.modelId ?? undefined,
    qrPayload: encodeAssetQr(asset.assetCode),
  };
}

/**
 * Persistence contract. The service depends only on this interface so
 * repositories can be swapped or mocked in tests.
 */
export interface IAssetRepository {
  getCategoryDistribution(): Promise<{ category: string; count: number }[]>;
  findMany(filters?: ListAssetsFilters): Promise<AssetRow[]>;
  findById(id: string): Promise<AssetRow | null>;
  findByAssetCode(assetCode: string): Promise<AssetRow | null>;
  findByModelId(modelId: string): Promise<AssetRow[]>;
  create(
    data: Omit<NewAssetRow, "id" | "createdAt" | "updatedAt" | "lastUpdated"> &
      Partial<Pick<NewAssetRow, "lastUpdated">>
  ): Promise<AssetRow>;
  update(
    id: string,
    data: Partial<Omit<AssetRow, "id" | "createdAt">>
  ): Promise<AssetRow | null>;
  delete(id: string): Promise<boolean>;
}
