import { dashboardController } from "@/server/modules/dashboard";

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Dashboard snapshot (counts, pending, overdue, low stock, activity)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [full, sidebar]
 *         description: |
 *           `sidebar` returns only summary counts (for nav badges).
 *           Default / omitted = full dashboard snapshot widgets.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("scope") === "sidebar") {
    return dashboardController.sidebarSummary();
  }
  return dashboardController.snapshot();
}
