import {
  api,
  env,
  getDb,
  eq,
  and,
  pages,
  ownPage,
  jsonBody,
  UserError,
} from "../../../../lib/manual-server";
import { validExtraction } from "../../../../lib/manual-core";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, ctx: Context) {
  return api(request, async (owner) => {
    const p = await ownPage(owner, (await ctx.params).id),
      body = await jsonBody(request);
    if (
      p.analysisToken &&
      Date.now() - Date.parse(p.analysisStartedAt ?? "") < 120000
    )
      throw new UserError(409, "正在整理这页说明书，请稍后再修改");
    let extraction = p.extraction;
    if (body.text !== undefined) {
      if (typeof body.text !== "string" || body.text.length > 24000)
        throw new UserError(400, "原文最多 24000 字");
      extraction = JSON.stringify(
        validExtraction({
          text: body.text,
          summary: "",
          features: [],
          procedures: [],
          unreadable: false,
        }),
      );
    }
    if (body.reviewed !== undefined && typeof body.reviewed !== "boolean")
      throw new UserError(400, "确认状态格式不正确");
    if (body.reviewed === true && !p.extraction)
      throw new UserError(400, "请先整理或补充原文，再确认核对");
    await getDb()
      .update(pages)
      .set({
        extraction,
        reviewed:
          body.text !== undefined
            ? false
            : body.reviewed === undefined
              ? p.reviewed
              : body.reviewed,
        analysisToken: null,
        analysisStartedAt: null,
      })
      .where(and(eq(pages.id, p.id), eq(pages.ownerId, owner)));
    return Response.json({ ok: true });
  });
}
export async function DELETE(request: Request, ctx: Context) {
  return api(request, async (owner) => {
    const p = await ownPage(owner, (await ctx.params).id);
    await env.BUCKET?.delete(p.objectKey);
    await getDb()
      .delete(pages)
      .where(and(eq(pages.id, p.id), eq(pages.ownerId, owner)));
    return Response.json({ ok: true });
  });
}
