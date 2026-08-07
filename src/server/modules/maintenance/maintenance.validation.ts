import { z } from "zod";

const assetCategorySchema = z.enum(["transport", "computing", "av", "furniture"]);
const conditionSchema = z.enum([
  "good",
  "needs_maintenance",
  "damaged",
  "resolved",
]);
const sourceSchema = z.enum(["return_checkout", "manual_flag"]);

export const listMaintenanceQuerySchema = z.object({
  openOnly: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "true"),
  search: z.string().trim().max(200).optional(),
  condition: conditionSchema.optional(),
});

export const createMaintenanceSchema = z.object({
  assetId: z.string().uuid().optional(),
  assetCode: z.string().trim().min(1).max(64),
  assetName: z.string().trim().min(1).max(255),
  category: assetCategorySchema,
  condition: conditionSchema.default("needs_maintenance"),
  source: sourceSchema.optional().default("manual_flag"),
  notes: z.string().trim().max(4000).optional().default(""),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  relatedBorrowLogCode: z.string().trim().max(64).optional(),
});

export const resolveMaintenanceSchema = z.object({
  resolutionNotes: z.string().trim().min(1).max(4000),
});

export const maintenanceIdSchema = z.string().uuid("Invalid maintenance log id.");

export type CreateMaintenanceBody = z.infer<typeof createMaintenanceSchema>;
export type ResolveMaintenanceBody = z.infer<typeof resolveMaintenanceSchema>;
export type ListMaintenanceQuery = z.infer<typeof listMaintenanceQuerySchema>;
