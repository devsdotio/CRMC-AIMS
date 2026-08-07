import { borrowLogController } from "@/server/modules/borrow-log";

/**
 * @swagger
 * /api/borrow-log:
 *   get:
 *     summary: List borrow/return custody logs
 *     tags: [BorrowLog]
 *   post:
 *     summary: Release an asset (create log + set current holder)
 *     tags: [BorrowLog]
 */
export async function GET(request: Request) {
  return borrowLogController.list(request);
}

export async function POST(request: Request) {
  return borrowLogController.release(request);
}
