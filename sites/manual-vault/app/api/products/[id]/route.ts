import {
  api,
  env,
  getDb,
  eq,
  and,
  products,
  pages,
  ownProduct,
  jsonBody,
} from "../../../../lib/manual-server";
import { productInput } from "../../../../lib/manual-core";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, ctx: Context) {
  return api(request, async (owner) => {
    const { id } = await ctx.params;
    const existing = await ownProduct(owner, id);
    const data = productInput({ ...existing, ...(await jsonBody(request)) });
    await getDb()
      .update(products)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(products.id, id), eq(products.ownerId, owner)));
    return Response.json({ ok: true });
  });
}
export async function DELETE(request: Request, ctx: Context) {
  return api(request, async (owner) => {
    const { id } = await ctx.params;
    await ownProduct(owner, id);
    const children = await getDb()
      .select()
      .from(pages)
      .where(and(eq(pages.productId, id), eq(pages.ownerId, owner)))
      .all();
    if (children.length && env.BUCKET)
      await env.BUCKET.delete(children.map((p) => p.objectKey));
    await getDb()
      .delete(products)
      .where(and(eq(products.id, id), eq(products.ownerId, owner)));
    return Response.json({ ok: true });
  });
}
