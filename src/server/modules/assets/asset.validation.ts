import { z } from "zod";

import { ASSET_STATUSES, ASSET_ASSIGNMENT_TYPES } from "./asset.constants";

/** Free-text category name (must match Settings → Asset categories). */
export const categoryLabelSchema = z
  .string()
  .trim()
  .min(1, "Category is required.")
  .max(120, "Category is too long.");

export const assetStatusSchema = z.enum(ASSET_STATUSES);
export const assetAssignmentTypeSchema = z.enum(ASSET_ASSIGNMENT_TYPES);

export const createAssetSchema = z.object({
  assetCode: z.string().trim().min(1, "assetCode is required.").max(64),
  name: z.string().trim().min(1, "name is required.").max(255),
  category: categoryLabelSchema,
  /** Omitted status defaults to `active` in the service (not via Zod default),
   * so update schemas can safely `.partial()` without forcing status. */
  status: assetStatusSchema.optional(),
  assignmentType: assetAssignmentTypeSchema.optional(),
  location: z.string().trim().min(1, "location is required.").max(255),
  serialNumber: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  purchaseDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "purchaseDate must be YYYY-MM-DD.")
    .optional(),
  value: z.number().nonnegative().optional(),
  supplierId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().trim().max(2048).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const updateAssetSchema = createAssetSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update.",
  });

/** Borrower is subject/assignee; staff actor always from session (never body). */
export const releaseAssetSchema = z.object({
  borrowerName: z
    .string()
    .trim()
    .min(1, "borrowerName is required for accountable release.")
    .max(255),
  borrowerDepartment: z.string().trim().min(1).max(120).optional(),
  borrowerEmail: z.string().trim().email().max(320).optional(),
  borrowerPhone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
  expectedReturnDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expectedReturnDate must be YYYY-MM-DD.")
    .optional(),
  requestId: z.string().uuid().optional(),
});

export const returnAssetSchema = z.object({
  condition: z.string().trim().min(1, "condition is required.").max(2000),
  status: assetStatusSchema.optional(),
  flagMaintenance: z.boolean().optional(),
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
