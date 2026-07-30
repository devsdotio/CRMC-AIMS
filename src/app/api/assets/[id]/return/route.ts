import {
  assetController,
  handleAssetControllerError,
} from "@/features/assets/controller";

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
    const body = await request.json();
    return await assetController.returnAsset(id, body);
  } catch (error) {
    return handleAssetControllerError(error);
  }
}
