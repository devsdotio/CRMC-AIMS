import type { Asset } from "@/server/db/schema";
import { ConflictError, NotFoundError } from "@/server/shared/errors";
import { AssetRepository } from "./asset.repository";
import {
  createAssetSchema,
  searchAssetSchema,
  updateAssetSchema,
  type CreateAssetInput,
  type UpdateAssetInput,
} from "./asset.validation";
import type {
  AssetDTO,
  AssetSearchFilters,
  PaginatedResult,
} from "./asset.types";
import { ASSET_CODE_PREFIX } from "./asset.constants";

export class AssetService {
  constructor(private readonly assetRepository: AssetRepository = new AssetRepository()) {}

  async createAsset(input: CreateAssetInput): Promise<AssetDTO> {
    const data = createAssetSchema.parse(input);

    const assetCode = await this.generateAssetCode();

    const asset = await this.assetRepository.create({
      assetCode,
      name: data.name,
      description: data.description ?? null,
      assetType: data.assetType,
      categoryId: data.categoryId,
      locationId: data.locationId,
      departmentId: data.departmentId ?? null,
      brand: data.brand ?? null,
      model: data.model ?? null,
      manufacturer: data.manufacturer ?? null,
      purchasePrice: data.purchasePrice?.toString() ?? null,
      purchaseDate: data.purchaseDate ?? null,
      status: "AVAILABLE",
      condition: data.condition ?? "NEW",
      archivedAt: null,
    });

    return this.toDTO(asset);
  }

  async getAssetById(id: string): Promise<AssetDTO> {
    const asset = await this.assetRepository.findById(id);
    if (!asset) {
      throw new NotFoundError("Asset", id);
    }
    return this.toDTO(asset);
  }

  async getAssets(includeArchived = false): Promise<AssetDTO[]> {
    const assetList = await this.assetRepository.findAll(includeArchived);
    return assetList.map((asset) => this.toDTO(asset));
  }

  async updateAsset(id: string, input: UpdateAssetInput): Promise<AssetDTO> {
    const data = updateAssetSchema.parse(input);

    const existing = await this.assetRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    const updated = await this.assetRepository.update(id, {
      ...data,
      purchasePrice:
        data.purchasePrice !== undefined
          ? data.purchasePrice.toString()
          : undefined,
    });

    if (!updated) {
      throw new NotFoundError("Asset", id);
    }

    return this.toDTO(updated);
  }

  async archiveAsset(id: string): Promise<AssetDTO> {
    const existing = await this.assetRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    if (existing.status === "ARCHIVED") {
      throw new ConflictError(`Asset "${id}" is already archived.`);
    }

    const archived = await this.assetRepository.archive(id);
    if (!archived) {
      throw new NotFoundError("Asset", id);
    }

    return this.toDTO(archived);
  }

  async deleteAsset(id: string): Promise<void> {
    const existing = await this.assetRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    // TODO: once asset_units / borrow_transactions / assignments exist,
    // guard against deleting an asset that has active units or open
    // transactions referencing it. For now, a hard delete is allowed.
    const deleted = await this.assetRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("Asset", id);
    }
  }

  async searchAssets(input: unknown): Promise<PaginatedResult<AssetDTO>> {
    const filters: AssetSearchFilters = searchAssetSchema.parse(input);

    const result = await this.assetRepository.search(filters);

    return {
      ...result,
      items: result.items.map((asset) => this.toDTO(asset)),
    };
  }

  /**
   * Generates a unique, human-readable asset code.
   *
   * TODO: This is a placeholder implementation. Replace with a proper
   * database sequence (e.g. a Postgres SEQUENCE or a dedicated counters
   * table) so codes are guaranteed sequential and gap-free under
   * concurrent writes. Current format: CRMC-<year>-<6 digit index>,
   * e.g. CRMC-2026-000001.
   */
  private async generateAssetCode(): Promise<string> {
    const year = new Date().getFullYear();

    // TODO: replace with an atomic counter/sequence lookup instead of
    // counting rows, which is not safe under concurrent inserts.
    const existing = await this.assetRepository.findAll(true);
    const countThisYear = existing.filter((asset) =>
      asset.assetCode.startsWith(`${ASSET_CODE_PREFIX}-${year}-`)
    ).length;

    const nextIndex = (countThisYear + 1).toString().padStart(6, "0");
    return `${ASSET_CODE_PREFIX}-${year}-${nextIndex}`;
  }

  /**
   * Maps a raw DB row to the public-facing DTO. Kept private so callers
   * (controllers) never depend on the internal Drizzle row shape.
   */
  private toDTO(asset: Asset): AssetDTO {
    return {
      id: asset.id,
      assetCode: asset.assetCode,
      name: asset.name,
      description: asset.description,
      assetType: asset.assetType,
      categoryId: asset.categoryId,
      locationId: asset.locationId,
      departmentId: asset.departmentId,
      brand: asset.brand,
      model: asset.model,
      manufacturer: asset.manufacturer,
      purchasePrice: asset.purchasePrice,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().slice(0, 10) : null,
      status: asset.status,
      condition: asset.condition,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      archivedAt: asset.archivedAt ? asset.archivedAt.toISOString() : null,
    };
  }
}
