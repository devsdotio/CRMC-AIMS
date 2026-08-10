import { CATEGORY_STYLES } from "@/constants/categories";

/** Matches PG `asset_category` and server `ASSET_CATEGORIES`. */
export const ASSET_CATEGORY_CODES = [
  "transport",
  "computing",
  "av",
  "furniture",
] as const;

export type AssetCategoryCode = (typeof ASSET_CATEGORY_CODES)[number];

/** Label for select options (stable, matches design tokens). */
export const ASSET_CATEGORY_OPTIONS: {
  value: AssetCategoryCode;
  label: string;
}[] = ASSET_CATEGORY_CODES.map((value) => ({
  value,
  label: CATEGORY_STYLES[value]?.label ?? value,
}));

const LABEL_ALIASES: Record<string, AssetCategoryCode> = {
  transport: "transport",
  vehicle: "transport",
  vehicles: "transport",
  computing: "computing",
  computer: "computing",
  computers: "computing",
  it: "computing",
  "it equipment": "computing",
  av: "av",
  "av equipment": "av",
  audio: "av",
  "audio visual": "av",
  furniture: "furniture",
};

/**
 * Map free-text category names (from categories admin or legacy data)
 * onto PG `asset_category` enum codes.
 */
export function normalizeAssetCategory(
  raw: string | null | undefined
): AssetCategoryCode | null {
  if (!raw?.trim()) return null;
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  if ((ASSET_CATEGORY_CODES as readonly string[]).includes(key)) {
    return key as AssetCategoryCode;
  }
  if (LABEL_ALIASES[key]) return LABEL_ALIASES[key];

  for (const code of ASSET_CATEGORY_CODES) {
    const label = CATEGORY_STYLES[code]?.label?.toLowerCase();
    if (label && label === key) return code;
  }
  return null;
}

export function assetCategoryCodePrefix(category: AssetCategoryCode): string {
  const prefixes: Record<AssetCategoryCode, string> = {
    transport: "TR",
    computing: "CP",
    av: "AV",
    furniture: "FN",
  };
  return prefixes[category];
}
