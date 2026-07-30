import { AssetRepository } from "@/features/assets/repository";
import { ConflictError, NotFoundError } from "@/features/assets/errors";
import type {
  Asset,
  AssetStatus,
  CreateAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
} from "@/features/assets/types";

function isPgUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code: unknown }).code) === "23505"
  );
}

export class AssetService {
  constructor(private readonly assetRepository = new AssetRepository()) {}

  async listAssets(filters?: { status?: AssetStatus }): Promise<Asset[]> {
    return this.assetRepository.findMany(filters);
  }

  async getAssetById(id: string): Promise<Asset> {
    const asset = await this.assetRepository.findById(id);

    if (!asset) {
      throw new NotFoundError("Asset not found.");
    }

    return asset;
  }

  async createAsset(input: CreateAssetInput): Promise<Asset> {
    try {
      return await this.assetRepository.create(input);
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        throw new ConflictError("Asset code already exists.");
      }

      throw error;
    }
  }

  async updateAsset(id: string, input: UpdateAssetInput): Promise<Asset> {
    try {
      const updatedAsset = await this.assetRepository.updateById(id, input);

      if (!updatedAsset) {
        throw new NotFoundError("Asset not found.");
      }

      return updatedAsset;
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        throw new ConflictError("Asset code already exists.");
      }

      throw error;
    }
  }

  async deleteAsset(id: string): Promise<void> {
    const deleted = await this.assetRepository.deleteById(id);

    if (!deleted) {
      throw new NotFoundError("Asset not found.");
    }
  }

  async releaseAsset(id: string): Promise<Asset> {
    const existingAsset = await this.assetRepository.findById(id);

    if (!existingAsset) {
      throw new NotFoundError("Asset not found.");
    }

    if (existingAsset.status !== "available") {
      throw new ConflictError("Asset is not available for release.");
    }

    const updatedAsset = await this.assetRepository.updateById(id, { status: "borrowed" });

    if (!updatedAsset) {
      throw new NotFoundError("Asset not found.");
    }

    return updatedAsset;
  }

  async returnAsset(id: string, input: ReturnAssetInput): Promise<Asset> {
    const existingAsset = await this.assetRepository.findById(id);

    if (!existingAsset) {
      throw new NotFoundError("Asset not found.");
    }

    if (existingAsset.status !== "borrowed") {
      throw new ConflictError("Only borrowed assets can be returned.");
    }

    const updatedAsset = await this.assetRepository.updateById(id, {
      condition: input.condition,
      status: input.status ?? "available",
    });

    if (!updatedAsset) {
      throw new NotFoundError("Asset not found.");
    }

    return updatedAsset;
  }
}
