import { borrowLogController } from "@/server/modules/borrow-log";

type Params = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/borrow-log/{id}/return:
 *   post:
 *     summary: Return a borrowed asset and close the log
 *     tags: [BorrowLog]
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  return borrowLogController.returnLog(request, id);
}
