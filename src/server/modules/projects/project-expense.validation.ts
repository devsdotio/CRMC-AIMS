import { z } from "zod";

/** Phase 2 writable line types (inventory/asset write-offs arrive later). */
export const PHASE2_LINE_TYPES = ["miscellaneous", "adjustment"] as const;

export const PROJECT_EXPENSE_CATEGORIES = [
  "travel",
  "snacks",
  "labor",
  "broken_asset",
  "fees",
  "adjustment",
  "miscellaneous",
] as const;

const amountSchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Amount must be a non-zero number (negative allowed for credits).",
      });
      return z.NEVER;
    }
    return n.toFixed(2);
  });

const optionalMoneySchema = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .transform((value, ctx) => {
    if (value === undefined || value === null || value === "") return null;
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({
        code: "custom",
        message: "Unit cost must be a non-negative amount.",
      });
      return z.NEVER;
    }
    return n.toFixed(2);
  });

const optionalQtySchema = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .transform((value, ctx) => {
    if (value === undefined || value === null || value === "") return null;
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Quantity must be a positive number.",
      });
      return z.NEVER;
    }
    return n.toFixed(2);
  });

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD.");

export const createProjectExpenseSchema = z
  .object({
    lineType: z.enum(PHASE2_LINE_TYPES).optional().default("miscellaneous"),
    category: z.enum(PROJECT_EXPENSE_CATEGORIES).optional().default("miscellaneous"),
    description: z.string().trim().min(1, "Description is required.").max(500),
    amount: amountSchema,
    quantity: optionalQtySchema,
    unitCost: optionalMoneySchema,
    incurredOn: dateSchema.optional(),
    notes: z.string().trim().max(4000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.lineType === "miscellaneous" && Number(data.amount) < 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "Miscellaneous spend must be positive. Use an adjustment line for credits.",
        path: ["amount"],
      });
    }
    if (data.lineType === "adjustment" && data.category !== "adjustment") {
      // Coerce category in service; warn only if forced mismatched via body later
    }
  });

export const updateProjectExpenseSchema = z
  .object({
    lineType: z.enum(PHASE2_LINE_TYPES).optional(),
    category: z.enum(PROJECT_EXPENSE_CATEGORIES).optional(),
    description: z.string().trim().min(1).max(500).optional(),
    amount: amountSchema.optional(),
    quantity: optionalQtySchema,
    unitCost: optionalMoneySchema,
    incurredOn: dateSchema.optional(),
    notes: z.string().trim().max(4000).optional().nullable(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field is required.",
  });

export const expenseIdSchema = z.string().uuid("Invalid expense id.");

/** Charge inventory stock onto a project (auto-checkout + FIFO cost). */
export const useConsumableOnProjectSchema = z.object({
  consumableId: z.string().uuid("Invalid consumable id."),
  quantity: z.number().int().positive("Quantity must be a positive integer."),
  description: z.string().trim().max(500).optional().nullable(),
  incurredOn: dateSchema.optional(),
  notes: z.string().trim().max(4000).optional().nullable(),
});

export type CreateProjectExpenseBody = z.infer<typeof createProjectExpenseSchema>;
export type UpdateProjectExpenseBody = z.infer<typeof updateProjectExpenseSchema>;
export type UseConsumableOnProjectBody = z.infer<
  typeof useConsumableOnProjectSchema
>;
