import { api, getDb, products, jsonBody } from "../../../lib/manual-server";
import { productInput } from "../../../lib/manual-core";
export async function POST(request: Request) {
  return api(request, async (owner) => {
    const now = new Date().toISOString();
    const product = {
      ...productInput(await jsonBody(request)),
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await getDb()
      .insert(products)
      .values({ ...product, ownerId: owner });
    return Response.json(product, { status: 201 });
  });
}
