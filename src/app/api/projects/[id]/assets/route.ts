import { projectController } from "@/server/modules/projects";

/**
 * @swagger
 * /api/projects/{id}/assets:
 *   get:
 *     summary: List project asset assignments
 *     tags: [Projects]
 *   post:
 *     summary: Assign an asset to a project (custody)
 *     tags: [Projects]
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return projectController.listAssets(request, id);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return projectController.assignAsset(request, id);
}
