import { z } from "zod";

export const assignAssetToProjectSchema = z.object({
  assetId: z.string().uuid("Invalid asset id."),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const returnProjectAssetSchema = z.object({
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const assignmentIdSchema = z.string().uuid("Invalid assignment id.");

export type AssignAssetToProjectBody = z.infer<
  typeof assignAssetToProjectSchema
>;
export type ReturnProjectAssetBody = z.infer<typeof returnProjectAssetSchema>;
