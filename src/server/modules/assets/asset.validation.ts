import { z } from "zod";

import { ASSET_CATEGORIES, ASSET_STATUSES } from "./asset.constants";

export const assetCategorySchema = z.enum(ASSET_CATEGORIES);
export const assetStatusSchema = z.enum(ASSET_STATUSES);

export const createAssetSchema = z.object({
  assetCode: z.string().trim().min(1, "assetCode is required.").max(64),
  name: z.string().trim().min(1, "name is required.").max(255),
  category: assetCategorySchema,
  /** Omitted status defaults to `active` in the service (not via Zod default),
   * so update schemas can safely `.partial()` without forcing status. */
  status: assetStatusSchema.optional(),
  location: z.string().trim().min(1, "location is required.").max(255),
  serialNumber: z.string().trim().max(120).optional(),
  currentHolder: z.string().trim().max(255).optional(),
  department: z.string().trim().max(120).optional(),
  purchaseDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "purchaseDate must be YYYY-MM-DD.")
    .optional(),
  value: z.number().nonnegative().optional(),
  imageUrl: z.string().trim().max(2048).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const updateAssetSchema = createAssetSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update.",
  });

export const returnAssetSchema = z.object({
  condition: z.string().trim().min(1, "condition is required.").max(2000),
  status: assetStatusSchema.optional(),
});

/** Borrower identity is subject/assignee; actor staff is always from session. */
export const releaseAssetSchema = z.object({
  borrowerName: z.string().trim().min(1).max(255).optional(),
  borrowerDepartment: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  expectedReturnDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expectedReturnDate must be YYYY-MM-DD.")
    .optional(),
});

export const flagMaintenanceSchema = z.object({
  description: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const listAssetsQuerySchema = z.object({
  status: assetStatusSchema.optional(),
});

export const assetIdSchema = z.string().uuid("Asset id must be a valid UUID.");

export type CreateAssetBody = z.infer<typeof createAssetSchema>;
export type UpdateAssetBody = z.infer<typeof updateAssetSchema>;
export type ReturnAssetBody = z.infer<typeof returnAssetSchema>;
export type ReleaseAssetBody = z.infer<typeof releaseAssetSchema>;
export type FlagMaintenanceBody = z.infer<typeof flagMaintenanceSchema>;
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>;
