import { NextResponse } from "next/server";

import { getApiDocs } from "@/lib/swagger";

/**
 * @swagger
 * /api/docs/spec:
 *   get:
 *     summary: OpenAPI JSON specification
 *     tags: [System]
 *     responses:
 *       200:
 *         description: OpenAPI document
 */
export async function GET() {
  const spec = getApiDocs();
  return NextResponse.json(spec);
}
