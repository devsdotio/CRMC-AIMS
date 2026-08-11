import { z } from "zod";

export const purchaseLotItemTypeSchema = z.enum(["consumable", "asset"]);

export const listPurchaseLotsQuerySchema = z.object({
  consumableId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  itemType: purchaseLotItemTypeSchema.optional(),
  search: z.string().trim().max(200).optional(),
});

export const purchaseLotIdSchema = z.string().uuid("Invalid purchase lot id.");

/** Staff scan: release qty from a supplier purchase lot. */
export const scanReleaseLotSchema = z.object({
  code: z.string().trim().min(1, "code (QR payload or lot code) is required."),
  quantity: z.number().int().positive("quantity must be positive."),
  reason: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
  recipientName: z.string().trim().max(255).optional(),
});

export type ListPurchaseLotsQuery = z.infer<typeof listPurchaseLotsQuerySchema>;
export type ScanReleaseLotBody = z.infer<typeof scanReleaseLotSchema>;
