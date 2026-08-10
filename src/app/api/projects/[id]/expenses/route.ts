import { projectController } from "@/server/modules/projects";

/**
 * @swagger
 * /api/projects/{id}/expenses:
 *   get:
 *     summary: List project expense lines
 *     tags: [Projects]
 *   post:
 *     summary: Add a misc / adjustment expense line
 *     tags: [Projects]
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return projectController.listExpenses(id);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return projectController.createExpense(request, id);
}
