import { borrowRequestController } from "@/server/modules/borrow-requests";

type Params = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/borrow-requests/{id}/return:
 *   post:
 *     summary: Mark a released borrow request as returned
 *     tags: [BorrowRequests]
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  return borrowRequestController.markReturned(request, id);
}
