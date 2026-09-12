import { eq, type Column, type SQL } from "drizzle-orm";
import { z } from "zod";

import type { AppRole } from "@/server/shared/roles";

/** Query/body flag: only honored for superadmin. */
export const includeSandboxQuerySchema = z
  .union([z.literal("true"), z.literal("false"), z.boolean()])
  .optional()
  .transform((v) => v === true || v === "true");

/**
 * Returns true only when the client asked for sandbox rows AND the actor is superadmin.
 * All other roles always get false (sandbox hidden).
 */
export function parseIncludeSandbox(
  raw: unknown,
  actorRole: AppRole | string | undefined | null
): boolean {
  if (actorRole !== "superadmin") return false;
  if (raw === true || raw === "true" || raw === "1") return true;
  return false;
}

/** When not including sandbox, require the column to be false. */
export function sandboxExcluded(
  column: Column,
  includeSandbox: boolean
): SQL | undefined {
  if (includeSandbox) return undefined;
  return eq(column, false);
}
