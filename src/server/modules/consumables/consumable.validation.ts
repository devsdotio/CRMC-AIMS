import { z } from "zod";

export const consumableCategorySchema = z.enum([
  "paper",
  "ink_toner",
  "cleaning",
  "office_supplies",
  "medical",
]);

export const stockLevelSchema = z.enum(["all", "healthy", "low", "critical"]);

export const listConsumablesQuerySchema = z.object({
  category: consumableCategorySchema.optional(),
  stockLevel: stockLevelSchema.optional(),
  search: z.string().trim().max(200).optional(),
});

export const createConsumableSchema = z.object({
  itemCode: z.string().trim().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(255),
  category: consumableCategorySchema,
  unit: z.string().trim().min(1).max(40),
  currentQty: z.number().int().min(0).optional().default(0),
  minThreshold: z.number().int().min(0).optional().default(0),
  location: z.string().trim().min(1).max(120),
  supplier: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateConsumableSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    category: consumableCategorySchema.optional(),
    unit: z.string().trim().min(1).max(40).optional(),
    minThreshold: z.number().int().min(0).optional(),
    location: z.string().trim().min(1).max(120).optional(),
    supplier: z.string().trim().max(255).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field is required.",
  });

export const stockMovementSchema = z.object({
  quantity: z.number().int().positive("quantity must be positive."),
  reason: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
});

/** Adjustment can increase or decrease; quantityChange signed. */
export const stockAdjustSchema = z.object({
  quantityChange: z
    .number()
    .int()
    .refine((n) => n !== 0, "quantityChange cannot be zero."),
  reason: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).optional(),
});

export const consumableIdSchema = z.string().uuid("Invalid consumable id.");

export type CreateConsumableBody = z.infer<typeof createConsumableSchema>;
export type UpdateConsumableBody = z.infer<typeof updateConsumableSchema>;
export type StockMovementBody = z.infer<typeof stockMovementSchema>;
export type StockAdjustBody = z.infer<typeof stockAdjustSchema>;
