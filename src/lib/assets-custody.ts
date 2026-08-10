/**
 * Custody display helpers for assets held by borrowers vs projects.
 */

export function isProjectCustody(holder?: string | null): boolean {
  return Boolean(holder?.startsWith("Project:"));
}

/** Short badge: Available | On project | Borrowed */
export function custodyBadgeLabel(holder?: string | null): string {
  if (!holder) return "Available";
  if (isProjectCustody(holder)) return "On project";
  return "Borrowed";
}

/** Longer label for table/card footers. */
export function custodyDetailLabel(holder?: string | null): string {
  if (!holder) return "Available in stock";
  if (isProjectCustody(holder)) return `Project custody: ${holder}`;
  return `Borrowed by: ${holder}`;
}
