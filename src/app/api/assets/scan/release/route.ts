import { assetController } from "@/server/modules/assets";

/**
 * @swagger
 * /api/assets/scan/release:
 *   post:
 *     summary: Release an asset after scanning its QR
 *     description: |
 *       Same custody rules as `POST /api/assets/{id}/release`, but the unit is
 *       identified by QR payload / asset code (for staff handheld scanners).
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, borrowerName]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "CRMC-AIMS:PRT-310-001"
 *               borrowerName:
 *                 type: string
 *               borrowerDepartment:
 *                 type: string
 *               borrowerEmail:
 *                 type: string
 *               borrowerPhone:
 *                 type: string
 *               notes:
 *                 type: string
 *               expectedReturnDate:
 *                 type: string
 *                 format: date
 *               requestId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Asset released
 *       404:
 *         description: Asset not found
 *       409:
 *         description: Not available for release
 */
export async function POST(request: Request) {
  return assetController.scanRelease(request);
}
