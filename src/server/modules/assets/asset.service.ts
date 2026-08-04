import type { Asset, MaintenanceLogEntry } from "@/features/assets/types";
import type { AssetRow } from "@/server/db/schema";
import {
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";

import { CHECKED_OUT_PLACEHOLDER } from "./asset.constants";
import { AssetRepository } from "./asset.repository";
import type { IAssetRepository, ListAssetsFilters } from "./asset.types";
import {
  assetIdSchema,
  createAssetSchema,
  listAssetsQuerySchema,
  returnAssetSchema,
  updateAssetSchema,
  type CreateAssetBody,
  type ReturnAssetBody,
  type UpdateAssetBody,
} from "./asset.validation";

function isPgUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code: unknown }).code) === "23505"
  );
}

function toDateString(value: Date | string): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

function parseValue(value: string | null): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeMaintenanceHistory(
  value: MaintenanceLogEntry[] | null | undefined
): MaintenanceLogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
}

/**
 * Maps a DB row → the exact frontend `Asset` contract so React Query hooks
 * and UI components can consume responses without adapters at integration time.
 */
export function toAssetDTO(row: AssetRow): Asset {
  return {
    id: row.id,
    assetCode: row.assetCode,
    name: row.name,
    category: row.category,
    status: row.status,
    serialNumber: row.serialNumber ?? undefined,
    location: row.location,
    currentHolder: row.currentHolder ?? undefined,
    department: row.department ?? undefined,
    purchaseDate: row.purchaseDate ?? undefined,
    value: parseValue(row.value),
    imageUrl: row.imageUrl ?? undefined,
    notes: row.notes ?? undefined,
    lastUpdated: toDateString(row.lastUpdated),
    maintenanceHistory: normalizeMaintenanceHistory(row.maintenanceHistory),
  };
}

function isAvailableForRelease(row: AssetRow): boolean {
  return row.status === "active" && !row.currentHolder;
}

function isBorrowed(row: AssetRow): boolean {
  return Boolean(row.currentHolder);
}

export class AssetService {
  constructor(
    private readonly assetRepository: IAssetRepository = new AssetRepository()
  ) {}

  async listAssets(rawQuery: unknown): Promise<Asset[]> {
    const filters: ListAssetsFilters = listAssetsQuerySchema.parse(rawQuery ?? {});
    const rows = await this.assetRepository.findMany(filters);
    return rows.map(toAssetDTO);
  }

  async getAssetById(rawId: string): Promise<Asset> {
    const id = assetIdSchema.parse(rawId);
    const row = await this.assetRepository.findById(id);

    if (!row) {
      throw new NotFoundError("Asset", id);
    }

    return toAssetDTO(row);
  }

  async createAsset(rawInput: unknown): Promise<Asset> {
    const input: CreateAssetBody = createAssetSchema.parse(rawInput);

    try {
      const now = new Date();
      const row = await this.assetRepository.create({
        assetCode: input.assetCode,
        name: input.name,
        category: input.category,
        status: input.status ?? "active",
        location: input.location,
        serialNumber: input.serialNumber ?? null,
        currentHolder: input.currentHolder ?? null,
        department: input.department ?? null,
        purchaseDate: input.purchaseDate ?? null,
        value: input.value !== undefined ? input.value.toFixed(2) : null,
        imageUrl: input.imageUrl ?? null,
        notes: input.notes ?? null,
        maintenanceHistory: [],
        lastUpdated: now,
      });

      return toAssetDTO(row);
    } catch (error) {
      if (isPgUniqueViolation(error)) {
        throw new ConflictError("Asset code already exists.");
      }
      throw error;
    }
  }

  async updateAsset(rawId: string, rawInput: unknown): Promise<Asset> {
    const id = assetIdSchema.parse(rawId);
    const input: UpdateAssetBody = updateAssetSchema.parse(rawInput);

    const existing = await this.assetRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    try {
      const updated = await this.assetRepository.update(id, {
        ...(input.assetCode !== undefined ? { assetCode: input.assetCode } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.serialNumber !== undefined
          ? { serialNumber: input.serialNumber }
          : {}),
        ...(input.currentHolder !== undefined
          ? { currentHolder: input.currentHolder }
          : {}),
        ...(input.department !== undefined ? { department: input.department } : {}),
        ...(input.purchaseDate !== undefined
          ? { purchaseDate: input.purchaseDate }
          : {}),
        ...(input.value !== undefined ? { value: input.value.toFixed(2) } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        lastUpdated: new Date(),
      });

      if (!updated) {
        throw new NotFoundError("Asset", id);
      }

      return toAssetDTO(updated);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (isPgUniqueViolation(error)) {
        throw new ConflictError("Asset code already exists.");
      }
      throw error;
    }
  }

  async deleteAsset(rawId: string): Promise<void> {
    const id = assetIdSchema.parse(rawId);
    const deleted = await this.assetRepository.delete(id);

    if (!deleted) {
      throw new NotFoundError("Asset", id);
    }
  }

  /**
   * Marks an available active asset as checked out.
   *
   * Temporary model: sets `currentHolder` to a placeholder. When borrow
   * requests land, this should accept borrower identity and write a
   * borrow_transaction instead.
   */
  async releaseAsset(rawId: string): Promise<Asset> {
    const id = assetIdSchema.parse(rawId);
    const existing = await this.assetRepository.findById(id);

    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    if (!isAvailableForRelease(existing)) {
      throw new ConflictError("Asset is not available for release.");
    }

    const updated = await this.assetRepository.update(id, {
      currentHolder: CHECKED_OUT_PLACEHOLDER,
      lastUpdated: new Date(),
    });

    if (!updated) {
      throw new NotFoundError("Asset", id);
    }

    return toAssetDTO(updated);
  }

  /**
   * Clears the current holder and records the return condition in notes.
   * Optional status lets the custodian flag needs_repair on return.
   */
  async returnAsset(rawId: string, rawInput: unknown): Promise<Asset> {
    const id = assetIdSchema.parse(rawId);
    const input: ReturnAssetBody = returnAssetSchema.parse(rawInput);

    const existing = await this.assetRepository.findById(id);

    if (!existing) {
      throw new NotFoundError("Asset", id);
    }

    if (!isBorrowed(existing)) {
      throw new ConflictError("Only borrowed assets can be returned.");
    }

    const conditionNote = `Returned: ${input.condition}`;
    const nextNotes = existing.notes
      ? `${existing.notes}\n${conditionNote}`
      : conditionNote;

    const updated = await this.assetRepository.update(id, {
      currentHolder: null,
      status: input.status ?? existing.status,
      notes: nextNotes,
      lastUpdated: new Date(),
    });

    if (!updated) {
      throw new NotFoundError("Asset", id);
    }

    return toAssetDTO(updated);
  }
}
