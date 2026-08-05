import {
  assetController,
  handleAssetControllerError,
} from "@/features/assets/controller";

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
    return await assetController.releaseAsset(id);
  } catch (error) {
    return handleAssetControllerError(error);
  }
}
