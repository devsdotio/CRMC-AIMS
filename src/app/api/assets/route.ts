import { NextResponse } from "next/server";

import { createAsset } from "@/features/assets/actions";
import { listAssets } from "@/features/assets/queries";
import type { CreateAssetInput } from "@/features/assets/types";

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: List all coded assets
 *     tags: [Assets]
 *     responses:
 *       200:
 *         description: List of assets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       category:
 *                         type: string
 *                       condition:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [available, borrowed, under_repair]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
export async function GET() {
  try {
    const data = await listAssets();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list assets.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/assets:
 *   post:
 *     summary: Create a new coded asset
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, category, condition]
 *             properties:
 *               code:
 *                 type: string
 *                 example: QR-ASSET-0001
 *               name:
 *                 type: string
 *                 example: Portable ECG Monitor
 *               category:
 *                 type: string
 *                 example: Medical Equipment
 *               condition:
 *                 type: string
 *                 example: Good
 *               status:
 *                 type: string
 *                 enum: [available, borrowed, under_repair]
 *                 example: available
 *     responses:
 *       201:
 *         description: Asset created successfully
 *       400:
 *         description: Invalid payload
 *       409:
 *         description: Duplicate asset code
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateAssetInput;
    const created = await createAsset(body);
    return NextResponse.json({ data: created }, { status: 201 });
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

    const message = error instanceof Error ? error.message : "Failed to create asset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
