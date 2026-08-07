import { borrowRequestController } from "@/server/modules/borrow-requests";

type Params = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/borrow-requests/{id}:
 *   get:
 *     summary: Get borrow request by id
 *     tags: [BorrowRequests]
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  return borrowRequestController.get(id);
}
