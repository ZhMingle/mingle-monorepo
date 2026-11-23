import {
  api,
  env,
  getDb,
  eq,
  pages,
  products,
  publicPage,
} from "../../../lib/manual-server";
export async function GET(request: Request) {
  return api(request, async (owner) => {
    const db = getDb();
    const [devices, images] = await Promise.all([
      db.select().from(products).where(eq(products.ownerId, owner)).all(),
      db.select().from(pages).where(eq(pages.ownerId, owner)).all(),
    ]);
    return Response.json(
      {
        products: devices
          .map(({ ownerId: _, ...p }) => p)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        pages: images
          .map(publicPage)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        aiEnabled: Boolean(env.OPENAI_API_KEY || env.OPENAI_KEY_ENVELOPE),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
