/**
 * Single source of truth for asset enums on the app side.
 * Must match `src/server/db/schema/assets.ts` and
 * `src/components/assets/types.ts`.
 */

export const ASSET_CATEGORIES = [
  "transport",
  "computing",
  "av",
  "furniture",
] as const;

export const ASSET_STATUSES = [
  "active",
  "needs_repair",
  "out_of_service",
  "retired",
] as const;

export const MAINTENANCE_TYPES = [
  "inspection",
  "repair",
  "maintenance",
  "flagged",
] as const;

/** Placeholder holder label used by release until borrower identity is wired. */
export const CHECKED_OUT_PLACEHOLDER = "Checked Out";
