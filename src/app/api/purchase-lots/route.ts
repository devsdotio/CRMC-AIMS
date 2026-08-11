import { purchaseLotController } from "@/server/modules/purchase-lots";

/**
 * @swagger
 * /api/purchase-lots:
 *   get:
 *     summary: List purchase / cost lots (multi-supplier price history)
 *     tags: [PurchaseLots]
 */
export async function GET(request: Request) {
  return purchaseLotController.list(request);
}
