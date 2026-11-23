import {
  api,
  env,
  getDb,
  pages,
  ownProduct,
  limitedBytes,
  UserError,
  publicPage,
  products,
  eq,
  and,
} from "../../../../../lib/manual-server";
import { imageMime, MAX_IMAGE_BYTES } from "../../../../../lib/manual-core";
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(request, async (owner) => {
    const { id } = await ctx.params;
    await ownProduct(owner, id);
    if (!env.BUCKET) throw new UserError(503, "原图存储暂时不可用");
    const body = await limitedBytes(request, MAX_IMAGE_BYTES + 65536);
    let form: FormData;
    try {
      form = await new Response(body, {
        headers: { "Content-Type": request.headers.get("content-type") ?? "" },
      }).formData();
    } catch {
      throw new UserError(400, "请上传有效的图片文件");
    }
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size === 0 ||
      file.size > MAX_IMAGE_BYTES
    )
      throw new UserError(400, "每张照片需为 1 字节至 12 MB");
    const bytes = new Uint8Array(await file.arrayBuffer()),
      mime = imageMime(bytes);
    if (!mime)
      throw new UserError(400, "请上传 JPG、PNG 或 WebP 照片，HEIC 请先转换");
    const pageId = crypto.randomUUID(),
      objectKey = `${owner}/${id}/${pageId}`,
      now = new Date().toISOString();
    const digest = await crypto.subtle.digest("SHA-256", bytes),
      sha256 = [...new Uint8Array(digest)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const row = {
      id: pageId,
      ownerId: owner,
      productId: id,
      filename: file.name.slice(0, 200) || "说明书照片",
      mime,
      size: bytes.length,
      sha256,
      objectKey,
      createdAt: now,
      extraction: null,
      reviewed: false,
      analysisToken: null,
      analysisStartedAt: null,
    };
    await env.BUCKET.put(objectKey, bytes, {
      httpMetadata: { contentType: mime },
    });
    try {
      const db = getDb();
      await db.batch([
        db.insert(pages).values(row),
        db
          .update(products)
          .set({ updatedAt: now })
          .where(and(eq(products.id, id), eq(products.ownerId, owner))),
      ]);
    } catch (e) {
      await env.BUCKET.delete(objectKey);
      throw e;
    }
    return Response.json(publicPage(row), { status: 201 });
  });
}
