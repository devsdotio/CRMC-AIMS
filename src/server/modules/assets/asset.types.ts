import type {
  Asset,
  AssetCategory,
  AssetStatus,
  CreateAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
} from "@/features/assets/types";
import type { AssetRow, NewAssetRow } from "@/server/db/schema";

export type {
  Asset,
  AssetCategory,
  AssetStatus,
  CreateAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
};

/**
 * List filters supported by GET /api/assets.
 * Client-side filtering (search, multi-status, sort) stays in the UI for now.
 */
export interface ListAssetsFilters {
  status?: AssetStatus;
}

/**
 * Persistence contract. The service depends only on this interface so
 * repositories can be swapped or mocked in tests.
 */
export interface IAssetRepository {
  findMany(filters?: ListAssetsFilters): Promise<AssetRow[]>;
  findById(id: string): Promise<AssetRow | null>;
  findByAssetCode(assetCode: string): Promise<AssetRow | null>;
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
