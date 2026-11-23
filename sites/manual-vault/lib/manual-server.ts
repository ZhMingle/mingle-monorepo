import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { getChatGPTUser } from "../app/chatgpt-auth";
import { getDb } from "../db";
import { pages, products } from "../db/schema";
import { UserError, validExtraction } from "./manual-core";
export { env, getDb, pages, products, and, eq, UserError };
export type PageRow = typeof pages.$inferSelect;
export function publicPage(p: PageRow) {
  return {
    id: p.id,
    productId: p.productId,
    filename: p.filename,
    mime: p.mime,
    size: p.size,
    sha256: p.sha256,
    createdAt: p.createdAt,
    reviewed: p.reviewed,
    extraction: p.extraction ? validExtraction(JSON.parse(p.extraction)) : null,
  };
}
export async function api(
  request: Request,
  run: (owner: string) => Promise<Response>,
) {
  try {
    const user = await getChatGPTUser();
    if (!user) throw new UserError(401, "请先登录，再保存你的说明书");
    if (
      request.method !== "GET" &&
      request.headers.get("origin") !== new URL(request.url).origin
    )
      throw new UserError(403, "请从本站发起操作");
    return await run(user.userId);
  } catch (error) {
    if (error instanceof UserError)
      return Response.json({ error: error.message }, { status: error.status });
    console.error(
      "Manual request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return Response.json(
      { error: "暂时无法完成操作，请稍后重试" },
      { status: 500 },
    );
  }
}
export async function limitedBytes(request: Request, limit: number) {
  if (Number(request.headers.get("content-length")) > limit)
    throw new UserError(413, "文件超过大小限制");
  const reader = request.body?.getReader();
  if (!reader) throw new UserError(400, "请求内容为空");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new UserError(413, "文件超过大小限制");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export async function jsonBody(request: Request) {
  try {
    const body = JSON.parse(
      new TextDecoder().decode(await limitedBytes(request, 100000)),
    );
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    return body as Record<string, unknown>;
  } catch (e) {
    if (e instanceof UserError) throw e;
    throw new UserError(400, "请求格式不正确");
  }
}
export async function ownProduct(owner: string, id: string) {
  const p = await getDb()
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.ownerId, owner)))
    .get();
  if (!p) throw new UserError(404, "找不到这件设备");
  return p;
}
export async function ownPage(owner: string, id: string) {
  const p = await getDb()
    .select()
    .from(pages)
    .where(and(eq(pages.id, id), eq(pages.ownerId, owner)))
    .get();
  if (!p) throw new UserError(404, "找不到这页说明书");
  return p;
}
