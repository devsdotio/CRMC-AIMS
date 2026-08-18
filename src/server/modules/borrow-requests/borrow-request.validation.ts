import { z } from "zod";

const assetCategorySchema = z
  .string()
  .trim()
  .min(1, "Category is required.")
  .max(120);

export const borrowRequestStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "released",
  "unreleased",
  "returned",
  "cancelled",
]);

export const listBorrowRequestsQuerySchema = z.object({
  status: borrowRequestStatusSchema.optional(),
  department: z.string().trim().max(120).optional(),
  search: z.string().trim().max(200).optional(),
  requesterUserId: z.string().uuid().optional(),
  requestType: z.enum(["borrowable", "assignable"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  assetId: z.string().uuid().optional(),
});

export const createBorrowRequestSchema = z.object({
  requesterName: z.string().trim().min(1).max(255),
  requesterEmail: z.string().trim().email().max(320),
  requesterPhone: z.string().trim().max(40).optional().default(""),
  departmentId: z.string().uuid().optional(),
  requestType: z.enum(["borrowable", "assignable"]).optional(),
  requestedByName: z.string().trim().max(255).optional(),
  items: z.array(
    z.object({
      itemDescription: z.string().trim().min(1).max(500),
      assetId: z.string().uuid().optional(),
      assetCode: z.string().trim().max(64).optional(),
      category: assetCategorySchema,
      quantity: z.number().int().min(1).max(999).optional().default(1),
      itemType: z.literal("asset"),
    })
  ).min(1, "At least one item is required."),
  purpose: z.string().trim().min(1).max(1000),
  expectedReturnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expectedReturnDate must be YYYY-MM-DD")
    .optional(),
  notes: z.string().trim().max(2000).optional(),
  requesterUserId: z.string().uuid().optional(),
}).superRefine((data, ctx) => {
  const requestType = data.requestType ?? "borrowable";
  if (requestType === "borrowable" && !data.expectedReturnDate) {
    ctx.addIssue({
      code: "custom",
      message: "expectedReturnDate is required for borrowable asset requests.",
      path: ["expectedReturnDate"],
    });
  }
});

export const approveBorrowRequestSchema = z.object({
  note: z.string().trim().max(1000).optional(),
  assetId: z.string().uuid().optional(),
  assetCode: z.string().trim().max(64).optional(),
});

export const rejectBorrowRequestSchema = z.object({
  reason: z.string().trim().min(1, "Rejection reason is required.").max(1000),
});

export const releaseBorrowRequestSchema = z.object({
  note: z.string().trim().max(1000).optional(),
  pickedUpBy: z.string().trim().min(1, "Name of person who picked up the item is required.").max(255),
});

export const markUnreleasedBorrowRequestSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});

export const returnBorrowRequestSchema = z.object({
  note: z.string().trim().max(1000).optional(),
  returnedBy: z.string().trim().min(1, "Name of person who returned the item is required.").max(255),
});

export const cancelBorrowRequestSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});

export const borrowRequestIdSchema = z.string().uuid("Invalid request id.");

export type CreateBorrowRequestBody = z.infer<typeof createBorrowRequestSchema>;
export type ApproveBorrowRequestBody = z.infer<typeof approveBorrowRequestSchema>;
export type RejectBorrowRequestBody = z.infer<typeof rejectBorrowRequestSchema>;
export type ReleaseBorrowRequestBody = z.infer<typeof releaseBorrowRequestSchema>;
export type MarkUnreleasedBorrowRequestBody = z.infer<typeof markUnreleasedBorrowRequestSchema>;
export type ReturnBorrowRequestBody = z.infer<typeof returnBorrowRequestSchema>;
export type CancelBorrowRequestBody = z.infer<typeof cancelBorrowRequestSchema>;
export type ListBorrowRequestsQuery = z.infer<typeof listBorrowRequestsQuerySchema>;
