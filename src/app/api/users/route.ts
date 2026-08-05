import { userController } from "@/server/modules/users";

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List application user profiles
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Profile list (superadmins hidden from admin callers)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a user manager
 *   post:
 *     summary: Provision a staff or borrower account (or admin if superadmin)
 *     tags: [Users]
 *     description: No public signup — invites/creates via service role.
 *     responses:
 *       201:
 *         description: Profile created
 *       403:
 *         description: Forbidden role assignment
 */
export async function GET(request: Request) {
  return userController.listUsers(request);
}

export async function POST(request: Request) {
  return userController.createUser(request);
}
