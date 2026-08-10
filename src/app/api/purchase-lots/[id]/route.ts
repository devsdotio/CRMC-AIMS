import { purchaseLotController } from "@/server/modules/purchase-lots";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return purchaseLotController.get(id);
}
