import { AssetRepository } from "@/features/assets/repository";
import type { AssetRecord } from "@/features/assets/repository";
import { ConflictError, NotFoundError } from "@/features/assets/errors";
import type {
  Asset,
  AssetCategory,
  AssetStatus,
  CreateAssetInput,
  ReturnAssetInput,
  UpdateAssetInput,
} from "@/features/assets/types";
import {
  parseAssetMetadata,
  serializeAssetMetadata,
} from "@/features/assets/repository";

type DbAssetStatus = AssetRecord["status"];

function mapUiStatusToDbStatus(status: AssetStatus): DbAssetStatus {
  if (status === "active") {
    return "available";
  }

  return "under_repair";
}

function mapDbStatusToUiStatus(status: DbAssetStatus): AssetStatus {
  if (status === "under_repair") {
    return "needs_repair";
  }

  return "active";
}

function normalizeUiCategory(category: string): AssetCategory {
  const normalized = category.trim().toLowerCase();

  if (normalized === "transport") {
    return "transport";
  }

  if (normalized === "av") {
    return "av";
  }

  if (normalized === "furniture") {
    return "furniture";
  }

  return "computing";
}

function mapUiStatusFilterToDbStatuses(status?: AssetStatus): DbAssetStatus[] | undefined {
  if (!status) {
    return undefined;
  }

  if (status === "active") {
    return ["available", "borrowed"];
  }

  return ["under_repair"];
}

function toUiAsset(record: AssetRecord): Asset {
  const metadata = parseAssetMetadata(record.condition);

  const lastUpdated =
    typeof metadata.lastUpdated === "string"
      ? metadata.lastUpdated
      : record.createdAt.toISOString().split("T")[0];

  return {
    id: record.id,
    assetCode: record.code,
    name: record.name,
    category: normalizeUiCategory(record.category),
    status: mapDbStatusToUiStatus(record.status),
    serialNumber: metadata.serialNumber,
    location: metadata.location ?? "Unassigned Location",
    currentHolder:
      record.status === "borrowed" ? metadata.currentHolder ?? "Checked Out" : metadata.currentHolder,
    department: metadata.department,
    purchaseDate: metadata.purchaseDate,
    value: metadata.value,
    imageUrl: metadata.imageUrl,
    notes: metadata.notes,
    lastUpdated,
    maintenanceHistory: metadata.maintenanceHistory ?? [],
  };
}

function buildMetadataFromCreateInput(input: CreateAssetInput) {
  return {
    serialNumber: input.serialNumber,
    location: input.location,
    currentHolder: input.currentHolder,
    department: input.department,
    purchaseDate: input.purchaseDate,
    value: input.value,
    imageUrl: input.imageUrl,
    notes: input.notes,
    maintenanceHistory: [],
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

function buildMetadataUpdate(input: UpdateAssetInput) {
  const metadataUpdate: Partial<CreateAssetInput> = {};

  if (input.serialNumber !== undefined) {
    metadataUpdate.serialNumber = input.serialNumber;
  }
  if (input.location !== undefined) {
    metadataUpdate.location = input.location;
  }
  if (input.currentHolder !== undefined) {
    metadataUpdate.currentHolder = input.currentHolder;
  }
  if (input.department !== undefined) {
    metadataUpdate.department = input.department;
  }
  if (input.purchaseDate !== undefined) {
    metadataUpdate.purchaseDate = input.purchaseDate;
  }
  if (input.value !== undefined) {
    metadataUpdate.value = input.value;
  }
  if (input.imageUrl !== undefined) {
    metadataUpdate.imageUrl = input.imageUrl;
  }
  if (input.notes !== undefined) {
    metadataUpdate.notes = input.notes;
  }

  metadataUpdate.lastUpdated = new Date().toISOString().split("T")[0];

  return metadataUpdate;
}

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
    const records = await this.assetRepository.findMany({
      statuses: mapUiStatusFilterToDbStatuses(filters?.status),
    });

    return records.map(toUiAsset);
  }

  async getAssetById(id: string): Promise<Asset> {
    const asset = await this.assetRepository.findById(id);

    if (!asset) {
      throw new NotFoundError("Asset not found.");
    }

    return toUiAsset(asset);
  }

  async createAsset(input: CreateAssetInput): Promise<Asset> {
    try {
      const created = await this.assetRepository.create({
        code: input.assetCode,
        name: input.name,
        category: input.category,
        status: mapUiStatusToDbStatus(input.status),
        condition: serializeAssetMetadata(buildMetadataFromCreateInput(input)),
      });

      return toUiAsset(created);
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        throw new ConflictError("Asset code already exists.");
      }

      throw error;
    }
  }

  async updateAsset(id: string, input: UpdateAssetInput): Promise<Asset> {
    try {
      const dbUpdatePayload: {
        code?: string;
        name?: string;
        category?: string;
        status?: DbAssetStatus;
      } = {};

      if (input.assetCode !== undefined) {
        dbUpdatePayload.code = input.assetCode;
      }
      if (input.name !== undefined) {
        dbUpdatePayload.name = input.name;
      }
      if (input.category !== undefined) {
        dbUpdatePayload.category = input.category;
      }
      if (input.status !== undefined) {
        dbUpdatePayload.status = mapUiStatusToDbStatus(input.status);
      }

      const updatedAsset = await this.assetRepository.updateById(id, dbUpdatePayload);

      await this.assetRepository.updateMetadataById(id, buildMetadataUpdate(input));

      const hydratedAsset = await this.assetRepository.findById(id);

      if (!updatedAsset || !hydratedAsset) {
        throw new NotFoundError("Asset not found.");
      }

      return toUiAsset(hydratedAsset);
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

    return toUiAsset(updatedAsset);
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
      status: mapUiStatusToDbStatus(input.status ?? "active"),
    });

    await this.assetRepository.updateMetadataById(id, {
      notes: input.condition,
      lastUpdated: new Date().toISOString().split("T")[0],
    });

    const hydratedAsset = await this.assetRepository.findById(id);

    if (!updatedAsset || !hydratedAsset) {
      throw new NotFoundError("Asset not found.");
    }

    return toUiAsset(hydratedAsset);
  }
}
