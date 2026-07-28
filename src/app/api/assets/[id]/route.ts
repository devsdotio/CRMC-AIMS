import { NextResponse } from "next/server";

import { deleteAsset, updateAsset } from "@/features/assets/actions";
import { getAssetById } from "@/features/assets/queries";
import type { UpdateAssetInput } from "@/features/assets/types";

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

/**
 * @swagger
 * /api/assets/{id}:
 *   patch:
 *     summary: Update a coded asset
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
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               condition:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [available, borrowed, under_repair]
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *       400:
 *         description: Invalid payload
 *       404:
 *         description: Asset not found
 *       409:
 *         description: Duplicate asset code
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateAssetInput;
    const data = await updateAsset(id, body);

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

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      String((error as { code: unknown }).code) === "23505"
    ) {
      return NextResponse.json({ error: "Asset code already exists." }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : "Failed to update asset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/assets/{id}:
 *   delete:
 *     summary: Delete a coded asset
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Asset deleted successfully
 *       404:
 *         description: Asset not found
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const deleted = await deleteAsset(id);

    if (!deleted) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("VALIDATION:")) {
      return NextResponse.json(
        { error: error.message.replace("VALIDATION:", "").trim() },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Failed to delete asset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
