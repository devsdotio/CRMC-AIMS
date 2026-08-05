import { z } from "zod";
import {
  ASSET_TYPES,
  ASSET_STATUSES,
  ASSET_CONDITIONS,
  MAX_PAGE_SIZE,
} from "./asset.constants";

const uuidField = z.string().uuid();

export const createAssetSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  description: z.string().trim().max(2000).optional(),
  assetType: z.enum(ASSET_TYPES),
  categoryId: uuidField,
  locationId: uuidField,
  departmentId: uuidField.nullable().optional(),
  brand: z.string().trim().max(120).optional(),
  model: z.string().trim().max(120).optional(),
  manufacturer: z.string().trim().max(120).optional(),
  purchasePrice: z.number().nonnegative().optional(),
  purchaseDate: z.coerce.date().optional(),
  condition: z.enum(ASSET_CONDITIONS).optional(),
});

export const updateAssetSchema = createAssetSchema
  .omit({ assetType: true })
  .partial()
  .extend({
    status: z.enum(ASSET_STATUSES).optional(),
    condition: z.enum(ASSET_CONDITIONS).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update.",
  });

export const searchAssetSchema = z.object({
  query: z.string().trim().min(1).optional(),
  assetType: z.enum(ASSET_TYPES).optional(),
  categoryId: uuidField.optional(),
  locationId: uuidField.optional(),
  departmentId: uuidField.optional(),
  status: z.enum(ASSET_STATUSES).optional(),
  condition: z.enum(ASSET_CONDITIONS).optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .optional()
    .default(20),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type SearchAssetInput = z.infer<typeof searchAssetSchema>;
