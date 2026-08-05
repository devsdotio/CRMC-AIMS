import { NextResponse } from "next/server";

import { getApiDocs } from "@/lib/swagger";
import { requireUser } from "@/server/shared/auth";
import { handleError } from "@/server/shared/http";

/**
 * @swagger
 * /api/docs/spec:
 *   get:
 *     summary: OpenAPI JSON specification
 *     tags: [System]
 *     responses:
 *       200:
 *         description: OpenAPI document
 *       401:
 *         description: Authentication required
 */
export async function GET() {
  try {
    await requireUser();
    const spec = getApiDocs();
    return NextResponse.json(spec);
  } catch (error) {
    return handleError(error);
  }
}
