import { projectController } from "@/server/modules/projects";

/**
 * @swagger
 * /api/projects/{id}/assets/{assignmentId}/return:
 *   post:
 *     summary: Return an asset from project custody
 *     tags: [Projects]
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const { id, assignmentId } = await context.params;
  return projectController.returnAsset(request, id, assignmentId);
}
