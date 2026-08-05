/**
 * These arrays are the single source of truth for the asset enums on the
 * application side. They must stay in sync with the Postgres enums defined
 * in `src/server/db/schema/assets.ts`.
 *
 * Kept as readonly tuples so Zod and TypeScript can both narrow to the
 * exact literal union instead of `string`.
 */

export const ASSET_TYPES = ["CONSUMABLE", "ASSIGNABLE", "BORROWABLE"] as const;

export const ASSET_STATUSES = [
  "AVAILABLE",
  "ASSIGNED",
  "BORROWED",
  "ARCHIVED",
] as const;

export const ASSET_CONDITIONS = [
  "NEW",
  "GOOD",
  "FAIR",
  "DAMAGED",
  "FOR_REPAIR",
  "DISPOSED",
] as const;

/** Prefix used by the asset code generator (see asset.service.ts). */
export const ASSET_CODE_PREFIX = "CRMC";

/** Default page size used by `search()` when the caller doesn't specify one. */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
