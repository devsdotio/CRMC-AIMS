import type { AssetModelRow } from "@/server/db/schema";
import type { Asset } from "@/types/assets";
import type { ActorContext } from "@/server/shared/auth";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/server/shared/errors";
import { generateOperationalCode } from "@/server/shared/codes";
import { CategoryRepository } from "@/server/modules/categories/category.repository";

import { AssetModelRepository } from "./asset.model.repository";
import {
  assetModelIdSchema,
  bulkRegisterUnitsSchema,
  createAssetModelSchema,
  listAssetModelsQuerySchema,
  updateAssetModelSchema,
  type BulkRegisterUnitsBody,
  type CreateAssetModelBody,
  type UpdateAssetModelBody,
} from "./asset.model.validation";
import type { AssetDTOWithMeta } from "./asset.types";

function parseValue(value: string | null): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export type AssetModelDTO = {
  id: string;
  modelCode: string;
  name: string;
  category: string;
  description?: string;
  manufacturer?: string;
  defaultAssignmentType: "borrowable" | "assignable";
  defaultLocation?: string;
  defaultUnitValue?: number;
  imageUrl?: string;
  notes?: string;
  unitCount: number;
  availableCount: number;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type BulkUnitsResult = {
  model: AssetModelDTO;
  units: AssetDTOWithMeta[];
  createdCount: number;
};

export function toAssetModelDTO(
  row: AssetModelRow,
  unitCount = 0,
  availableCount = 0
): AssetModelDTO {
  return {
    id: row.id,
    modelCode: row.modelCode,
    name: row.name,
    category: row.category,
    description: row.description ?? undefined,
    manufacturer: row.manufacturer ?? undefined,
    defaultAssignmentType: row.defaultAssignmentType,
    defaultLocation: row.defaultLocation ?? undefined,
    defaultUnitValue: parseValue(row.defaultUnitValue),
    imageUrl: row.imageUrl ?? undefined,
    notes: row.notes ?? undefined,
    unitCount,
    availableCount,
    createdByUserId: row.createdByUserId,
    createdByName: row.createdByName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class AssetModelService {
  constructor(
    private readonly modelRepo: AssetModelRepository = new AssetModelRepository(),
    private readonly taxonomy: CategoryRepository = new CategoryRepository()
  ) {}

  async list(rawQuery: unknown): Promise<AssetModelDTO[]> {
    const filters = listAssetModelsQuerySchema.parse(rawQuery ?? {});
    const rows = await this.modelRepo.list(filters);
    return Promise.all(
      rows.map(async (row) =>
        toAssetModelDTO(
          row,
          await this.modelRepo.countUnits(row.id),
          await this.modelRepo.countAvailableUnits(row.id)
        )
      )
    );
  }

  async getById(rawId: string): Promise<AssetModelDTO> {
    const id = assetModelIdSchema.parse(rawId);
    const row = await this.modelRepo.findById(id);
    if (!row) throw new NotFoundError("Asset model", id);
    return toAssetModelDTO(
      row,
      await this.modelRepo.countUnits(row.id),
      await this.modelRepo.countAvailableUnits(row.id)
    );
  }

  async create(
    rawInput: unknown,
    actor: ActorContext
  ): Promise<AssetModelDTO> {
    const input: CreateAssetModelBody = createAssetModelSchema.parse(rawInput);

    const found = await this.taxonomy.findByTypeAndName("asset", input.category);
    if (!found) {
      throw new BadRequestError(
        `Unknown asset category “${input.category}”. Add it under Settings → Categories first.`
      );
    }

    const existing = await this.modelRepo.findByModelCode(input.modelCode);
    if (existing) {
      throw new ConflictError(`Model code ${input.modelCode} already exists.`);
    }

    const row = await this.modelRepo.create({
      modelCode: input.modelCode,
      name: input.name,
      category: found.name,
      description: input.description ?? null,
      manufacturer: input.manufacturer ?? null,
      defaultAssignmentType: input.defaultAssignmentType ?? "borrowable",
      defaultLocation: input.defaultLocation ?? null,
      defaultUnitValue:
        input.defaultUnitValue !== undefined
          ? input.defaultUnitValue.toFixed(2)
          : null,
      imageUrl: input.imageUrl ?? null,
      notes: input.notes ?? null,
      createdByUserId: actor.userId,
      createdByName: actor.displayName,
    });

    return toAssetModelDTO(row, 0, 0);
  }

  async update(rawId: string, rawInput: unknown): Promise<AssetModelDTO> {
    const id = assetModelIdSchema.parse(rawId);
    const input: UpdateAssetModelBody = updateAssetModelSchema.parse(rawInput);

    const existing = await this.modelRepo.findById(id);
    if (!existing) throw new NotFoundError("Asset model", id);

    if (input.modelCode && input.modelCode !== existing.modelCode) {
      const clash = await this.modelRepo.findByModelCode(input.modelCode);
      if (clash) {
        throw new ConflictError(`Model code ${input.modelCode} already exists.`);
      }
    }

    let categoryName: string | undefined;
    if (input.category !== undefined) {
      const found = await this.taxonomy.findByTypeAndName(
        "asset",
        input.category
      );
      if (!found) {
        throw new BadRequestError(
          `Unknown asset category “${input.category}”. Add it under Settings → Categories first.`
        );
      }
      categoryName = found.name;
    }

    const updated = await this.modelRepo.update(id, {
      ...(input.modelCode !== undefined ? { modelCode: input.modelCode } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(categoryName !== undefined ? { category: categoryName } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.manufacturer !== undefined
        ? { manufacturer: input.manufacturer }
        : {}),
      ...(input.defaultAssignmentType !== undefined
        ? { defaultAssignmentType: input.defaultAssignmentType }
        : {}),
      ...(input.defaultLocation !== undefined
        ? { defaultLocation: input.defaultLocation }
        : {}),
      ...(input.defaultUnitValue !== undefined
        ? { defaultUnitValue: input.defaultUnitValue.toFixed(2) }
        : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });

    if (!updated) throw new NotFoundError("Asset model", id);
    return toAssetModelDTO(
      updated,
      await this.modelRepo.countUnits(updated.id),
      await this.modelRepo.countAvailableUnits(updated.id)
    );
  }

  async delete(rawId: string): Promise<void> {
    const id = assetModelIdSchema.parse(rawId);
    const existing = await this.modelRepo.findById(id);
    if (!existing) throw new NotFoundError("Asset model", id);

    const units = await this.modelRepo.countUnits(id);
    if (units > 0) {
      throw new ConflictError(
        `Cannot delete model with ${units} registered unit(s). Unlink or delete units first.`
      );
    }

    const deleted = await this.modelRepo.delete(id);
    if (!deleted) throw new NotFoundError("Asset model", id);
  }

  /**
   * Resolve model or throw. Used by AssetService bulk registration.
   */
  async requireModel(id: string): Promise<AssetModelRow> {
    const row = await this.modelRepo.findById(id);
    if (!row) throw new NotFoundError("Asset model", id);
    return row;
  }

  /**
   * Create model row without unit counts (tx-friendly path used by bulk create).
   */
  async createRow(
    input: CreateAssetModelBody,
    actor: ActorContext,
    categoryName: string
  ): Promise<AssetModelRow> {
    const code = input.modelCode || generateOperationalCode("MDL");
    const existing = await this.modelRepo.findByModelCode(code);
    if (existing) {
      throw new ConflictError(`Model code ${code} already exists.`);
    }

    return this.modelRepo.create({
      modelCode: code,
      name: input.name,
      category: categoryName,
      description: input.description ?? null,
      manufacturer: input.manufacturer ?? null,
      defaultAssignmentType: input.defaultAssignmentType ?? "borrowable",
      defaultLocation: input.defaultLocation ?? null,
      defaultUnitValue:
        input.defaultUnitValue !== undefined
          ? input.defaultUnitValue.toFixed(2)
          : null,
      imageUrl: input.imageUrl ?? null,
      notes: input.notes ?? null,
      createdByUserId: actor.userId,
      createdByName: actor.displayName,
    });
  }

  get repository() {
    return this.modelRepo;
  }

  parseBulkUnits(raw: unknown): BulkRegisterUnitsBody {
    return bulkRegisterUnitsSchema.parse(raw);
  }

  assertSerials(
    quantity: number,
    serialNumbers?: string[]
  ): void {
    if (serialNumbers && serialNumbers.length !== quantity) {
      throw new BadRequestError("serialNumbers length must match quantity.");
    }
  }
}

// re-export type for service consumers
export type { Asset };
