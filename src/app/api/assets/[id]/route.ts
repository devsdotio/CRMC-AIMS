import {
  assetController,
  handleAssetControllerError,
} from "@/features/assets/controller";

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
    return await assetController.getAssetById(id);
  } catch (error) {
    return handleAssetControllerError(error);
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
    const body = await request.json();
    return await assetController.updateAsset(id, body);
  } catch (error) {
    return handleAssetControllerError(error);
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
    return await assetController.deleteAsset(id);
  } catch (error) {
    return handleAssetControllerError(error);
  }
}
