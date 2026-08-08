import { borrowRequestController } from "@/server/modules/borrow-requests";

/**
 * @swagger
 * /api/borrow-requests:
 *   get:
 *     summary: List borrow requests
 *     tags: [BorrowRequests]
 *   post:
 *     summary: Create a borrow request (staff-recorded)
 *     tags: [BorrowRequests]
 */
export async function GET(request: Request) {
  return borrowRequestController.list(request);
}

export async function POST(request: Request) {
  return borrowRequestController.create(request);
}
