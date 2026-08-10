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

export type ListPurchaseLotsQuery = z.infer<typeof listPurchaseLotsQuerySchema>;
