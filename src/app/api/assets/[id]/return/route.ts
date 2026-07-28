import { NextResponse } from "next/server";

import { returnAsset } from "@/features/assets/actions";
import type { ReturnAssetInput } from "@/features/assets/types";

/**
 * @swagger
 * /api/assets/{id}/return:
 *   post:
 *     summary: Return a borrowed coded asset
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [condition]
 *             properties:
 *               condition:
 *                 type: string
 *                 example: Good - cleaned and complete
 *               status:
 *                 type: string
 *                 enum: [available, under_repair]
 *                 description: Set to under_repair when returned with issues
 *     responses:
 *       200:
 *         description: Asset returned successfully
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: Asset not found
 *       409:
 *         description: Asset is not currently borrowed
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as ReturnAssetInput;
    const data = await returnAsset(id, body);

    if (!data) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("VALIDATION:")) {
      return NextResponse.json(
        { error: error.message.replace("VALIDATION:", "").trim() },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.startsWith("CONFLICT:")) {
      return NextResponse.json(
        { error: error.message.replace("CONFLICT:", "").trim() },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to return asset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
