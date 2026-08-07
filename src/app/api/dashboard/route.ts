import { dashboardController } from "@/server/modules/dashboard";

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Dashboard snapshot (counts, pending, overdue, low stock, activity)
 *     tags: [Dashboard]
 */
export async function GET() {
  return dashboardController.snapshot();
}
