import { borrowRequestController } from "@/server/modules/borrow-requests";

type Params = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/borrow-requests/{id}/release:
 *   post:
 *     summary: Release an approved borrow request
 *     tags: [BorrowRequests]
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  return borrowRequestController.release(request, id);
}
