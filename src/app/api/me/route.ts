import { authController } from "@/server/modules/auth";

/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Current authenticated profile (alias of GET /api/auth/me)
 *     description: Kept for existing client hooks. Prefer `/api/auth/me` for new work.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Active application profile
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: No profile or deactivated
 */
export async function GET() {
  return authController.me();
}
