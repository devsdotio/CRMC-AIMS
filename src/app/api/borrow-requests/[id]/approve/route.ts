import { borrowRequestController } from "@/server/modules/borrow-requests";

type Params = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/borrow-requests/{id}/approve:
 *   post:
 *     summary: Approve a pending borrow request
 *     tags: [BorrowRequests]
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  return borrowRequestController.approve(request, id);
}
