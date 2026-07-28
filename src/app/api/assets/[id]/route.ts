import { NextResponse } from "next/server";

import { getAssetById } from "@/features/assets/queries";

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Get a coded asset by id
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asset details
 *       404:
 *         description: Asset not found
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const data = await getAssetById(id);

    if (!data) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get asset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
