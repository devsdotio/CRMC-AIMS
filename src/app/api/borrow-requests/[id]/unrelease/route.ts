import { borrowRequestController } from "@/server/modules/borrow-requests";

type Params = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/borrow-requests/{id}/unrelease:
 *   post:
 *     summary: Mark an approved borrow request as unreleased
 *     tags: [BorrowRequests]
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  return borrowRequestController.markUnreleased(request, id);
}
