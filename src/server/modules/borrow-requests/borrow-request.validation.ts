import { z } from "zod";

const assetCategorySchema = z.enum(["transport", "computing", "av", "furniture"]);

export const borrowRequestStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "returned",
]);

export const listBorrowRequestsQuerySchema = z.object({
  status: borrowRequestStatusSchema.optional(),
  department: z.string().trim().max(120).optional(),
  search: z.string().trim().max(200).optional(),
  requesterUserId: z.string().uuid().optional(),
});

export const createBorrowRequestSchema = z.object({
  requesterName: z.string().trim().min(1).max(255),
  requesterEmail: z.string().trim().email().max(320),
  requesterPhone: z.string().trim().max(40).optional().default(""),
  department: z.string().trim().min(1).max(120),
  itemDescription: z.string().trim().min(1).max(500),
  assetId: z.string().uuid().optional(),
  assetCode: z.string().trim().max(64).optional(),
  category: assetCategorySchema,
  quantity: z.number().int().min(1).max(999).optional().default(1),
  purpose: z.string().trim().min(1).max(1000),
  expectedReturnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expectedReturnDate must be YYYY-MM-DD"),
  notes: z.string().trim().max(2000).optional(),
  requesterUserId: z.string().uuid().optional(),
});

export const approveBorrowRequestSchema = z.object({
  note: z.string().trim().max(1000).optional(),
  assetId: z.string().uuid().optional(),
  assetCode: z.string().trim().max(64).optional(),
});

export const rejectBorrowRequestSchema = z.object({
  reason: z.string().trim().min(1, "Rejection reason is required.").max(1000),
});

export const borrowRequestIdSchema = z.string().uuid("Invalid request id.");

export type CreateBorrowRequestBody = z.infer<typeof createBorrowRequestSchema>;
export type ApproveBorrowRequestBody = z.infer<typeof approveBorrowRequestSchema>;
export type RejectBorrowRequestBody = z.infer<typeof rejectBorrowRequestSchema>;
export type ListBorrowRequestsQuery = z.infer<typeof listBorrowRequestsQuerySchema>;
