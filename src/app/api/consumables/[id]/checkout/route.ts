import { consumableController } from "@/server/modules/consumables";

type Params = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/consumables/{id}/checkout:
 *   post:
 *     summary: Issue stock (legacy checkout alias)
 *     description: |
 *       Thin alias of `POST /api/consumables/{id}/issue` with FIFO lot draw.
 *       Prefer `/issue` for new clients. Destination must be department XOR project.
 *     tags: [Consumables]
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  return consumableController.checkout(request, id);
}
