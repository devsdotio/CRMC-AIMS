/**
 * Global display sanitizers to guarantee UUIDs, raw database keys, and technical identifiers
 * are never rendered directly on user screens.
 */

export const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Checks if a given string is a raw UUID */
export function isUuid(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

/**
 * Sanitizes any string to ensure UUIDs are replaced with a friendly fallback
 * or stripped if embedded in longer text.
 */
export function sanitizeDisplay(val?: string | null, fallback = "—"): string {
  if (!val) return fallback;
  const trimmed = val.trim();
  if (isUuid(trimmed)) return fallback;
  if (UUID_REGEX.test(trimmed)) {
    const cleaned = trimmed.replace(UUID_REGEX, "").trim();
    return cleaned.length > 0 ? cleaned : fallback;
  }
  return trimmed;
}

/**
 * Ensures item descriptions never show raw UUIDs, defaulting to clean category titles.
 */
export function formatItemDescription(
  description?: string | null,
  categoryLabel?: string | null,
  itemType?: "asset" | "consumable"
): string {
  if (description && !isUuid(description)) {
    return description;
  }
  const cat = categoryLabel ? `${categoryLabel} ` : "";
  return itemType === "consumable" ? `${cat}Supply` : `${cat}Equipment`;
}

/**
 * Ensures asset code badges only show real human codes (e.g. AST-001, AV-012)
 * and never internal UUIDs or category IDs.
 */
export function formatAssetCodeDisplay(
  code?: string | null
): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  if (isUuid(trimmed) || trimmed.toLowerCase().startsWith("cat-") || trimmed.toLowerCase().startsWith("cons-")) {
    return null;
  }
  return trimmed;
}
