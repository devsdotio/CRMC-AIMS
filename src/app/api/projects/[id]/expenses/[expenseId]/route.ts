import { projectController } from "@/server/modules/projects";

/**
 * @swagger
 * /api/projects/{id}/expenses/{expenseId}:
 *   patch:
 *     summary: Update a project expense line
 *     tags: [Projects]
 *   delete:
 *     summary: Delete a project expense line
 *     tags: [Projects]
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; expenseId: string }> }
) {
  const { id, expenseId } = await context.params;
  return projectController.updateExpense(request, id, expenseId);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; expenseId: string }> }
) {
  const { id, expenseId } = await context.params;
  return projectController.deleteExpense(id, expenseId);
}
