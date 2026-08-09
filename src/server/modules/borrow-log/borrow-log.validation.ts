import { z } from "zod";

const assetCategorySchema = z.enum(["transport", "computing", "av", "furniture"]);
const returnConditionSchema = z.enum(["good", "damaged", "needs_repair"]);

/** DTO/query filter includes computed overdue. */
export const logFilterStatusSchema = z.enum(["active", "overdue", "returned"]);

export const listBorrowLogQuerySchema = z.object({
  status: logFilterStatusSchema.optional(),
  department: z.string().trim().max(120).optional(),
  search: z.string().trim().max(200).optional(),
  borrowerUserId: z.string().uuid().optional(),
});

export const releaseBorrowSchema = z.object({
  assetId: z.string().uuid("assetId is required."),
  requestId: z.string().uuid().optional(),
  requestCode: z.string().trim().max(64).optional(),
  borrowerName: z.string().trim().min(1).max(255),
  borrowerEmail: z.string().trim().email().max(320).optional().default(""),
  borrowerPhone: z.string().trim().max(40).optional().default(""),
  department: z.string().trim().min(1).max(120),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD"),
  notes: z.string().trim().max(2000).optional(),
  borrowerUserId: z.string().uuid().optional(),
});

export const returnBorrowSchema = z.object({
  condition: returnConditionSchema,
  conditionNotes: z.string().trim().max(2000).optional(),
  flagMaintenance: z.boolean().optional().default(false),
});

export const borrowLogIdSchema = z.string().uuid("Invalid log id.");
export const assetCategorySchemaExport = assetCategorySchema;

export type ReleaseBorrowBody = z.infer<typeof releaseBorrowSchema>;
export type ReturnBorrowBody = z.infer<typeof returnBorrowSchema>;
export type ListBorrowLogQuery = z.infer<typeof listBorrowLogQuerySchema>;
