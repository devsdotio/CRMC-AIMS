/**
 * Shared code generators and DTO helpers for operational modules.
 */

export function yearPrefix(prefix: string, now = new Date()): string {
  return `${prefix}-${now.getUTCFullYear()}-`;
}

/** e.g. REQ-2026-0001 */
export function formatSequentialCode(
  prefix: string,
  sequential: number,
  now = new Date()
): string {
  const n = String(Math.max(1, sequential)).padStart(4, "0");
  return `${prefix}-${now.getUTCFullYear()}-${n}`;
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function todayDateString(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
