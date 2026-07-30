import {
  assetController,
  handleAssetControllerError,
} from "@/features/assets/controller";

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: List all coded assets
 *     tags: [Assets]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [available, borrowed, under_repair]
 *         description: Filter by current asset status
 *     responses:
 *       200:
 *         description: List of assets
 *       400:
 *         description: Invalid query parameter
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
export async function GET(request: Request) {
  try {
    return await assetController.listAssets(request);
  } catch (error) {
    return handleAssetControllerError(error);
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
    const body = await request.json();
    return await assetController.createAsset(body);
  } catch (error) {
    return handleAssetControllerError(error);
  }
}
