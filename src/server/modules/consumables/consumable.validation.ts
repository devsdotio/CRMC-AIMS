import { z } from "zod";

/** Free-text category name (must match Settings → Consumable categories). */
export const consumableCategorySchema = z
  .string()
  .trim()
  .min(1, "Category is required.")
  .max(120);

export const stockLevelSchema = z.enum(["all", "healthy", "low", "critical"]);

export const listConsumablesQuerySchema = z.object({
  category: consumableCategorySchema.optional(),
  stockLevel: stockLevelSchema.optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
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

/**
 * Restock with cost tracking (phase 1.5).
 * `unitCost` is required so project spend can later price inventory use correctly.
 */
export const restockSchema = z.object({
  quantity: z.number().int().positive("quantity must be positive."),
  unitCost: z
    .union([z.string(), z.number()])
    .transform((value, ctx) => {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({
          code: "custom",
          message: "unitCost must be a non-negative amount.",
        });
        return z.NEVER;
      }
      return n.toFixed(2);
    }),
  supplierId: z.string().uuid().optional().nullable(),
  reason: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
  purchasedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
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
export type RestockBody = z.infer<typeof restockSchema>;
export type StockAdjustBody = z.infer<typeof stockAdjustSchema>;
