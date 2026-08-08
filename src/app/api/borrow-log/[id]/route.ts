import { borrowLogController } from "@/server/modules/borrow-log";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  return borrowLogController.get(id);
}
