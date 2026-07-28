import { NextResponse } from "next/server";

import { releaseAsset } from "@/features/assets/actions";

/**
 * @swagger
 * /api/assets/{id}/release:
 *   post:
 *     summary: Release a coded asset to borrower flow
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
 *         description: Asset released successfully
 *       404:
 *         description: Asset not found
 *       409:
 *         description: Asset is not available for release
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const data = await releaseAsset(id);

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

    const message = error instanceof Error ? error.message : "Failed to release asset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
