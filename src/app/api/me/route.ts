import { userController } from "@/server/modules/users";

/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Current authenticated profile (role, name, email)
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
  return userController.me();
}
