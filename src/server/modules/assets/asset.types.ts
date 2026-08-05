import type { Asset, NewAsset } from "@/server/db/schema";
import type {
  ASSET_TYPES,
  ASSET_STATUSES,
  ASSET_CONDITIONS,
} from "./asset.constants";

export type AssetType = (typeof ASSET_TYPES)[number];
export type AssetStatus = (typeof ASSET_STATUSES)[number];
export type AssetCondition = (typeof ASSET_CONDITIONS)[number];

/**
 * Shape returned to API consumers. Deliberately decoupled from the raw
 * Drizzle row type so the DB schema can evolve without breaking clients,
 * and so numeric/date fields are serialized predictably over JSON.
 */
export interface AssetDTO {
  id: string;
  assetCode: string;
  name: string;
  description: string | null;
  assetType: AssetType;
  categoryId: string;
  locationId: string;
  departmentId: string | null;
  brand: string | null;
  model: string | null;
  manufacturer: string | null;
  purchasePrice: string | null; // numeric columns come back as strings
  purchaseDate: string | null; // ISO date string
  status: AssetStatus;
  condition: AssetCondition;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface CreateAssetDTO {
  name: string;
  description?: string;
  assetType: AssetType;
  categoryId: string;
  locationId: string;
  departmentId?: string | null;
  brand?: string;
  model?: string;
  manufacturer?: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  condition?: AssetCondition;
}

export type UpdateAssetDTO = Partial<
  Omit<CreateAssetDTO, "assetType">
> & {
  status?: AssetStatus;
  condition?: AssetCondition;
};

export interface AssetSearchFilters {
  query?: string;
  assetType?: AssetType;
  categoryId?: string;
  locationId?: string;
  departmentId?: string;
  status?: AssetStatus;
  condition?: AssetCondition;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Contract the service depends on. Defining this here (rather than only
 * having a concrete class) keeps the service testable/mockable and makes
 * the repository swappable without touching business logic.
 */
export interface IAssetRepository {
  create(data: Omit<NewAsset, "id" | "createdAt" | "updatedAt">): Promise<Asset>;
  findById(id: string): Promise<Asset | null>;
  findByAssetCode(assetCode: string): Promise<Asset | null>;
  findAll(includeArchived?: boolean): Promise<Asset[]>;
  update(id: string, data: Partial<Asset>): Promise<Asset | null>;
  archive(id: string): Promise<Asset | null>;
  delete(id: string): Promise<boolean>;
  search(filters: AssetSearchFilters): Promise<PaginatedResult<Asset>>;
}
