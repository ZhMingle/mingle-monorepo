import { api, env, ownPage, UserError } from "../../../../../lib/manual-server";
export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return api(request, async (owner) => {
    const p = await ownPage(owner, (await ctx.params).id),
      object = await env.BUCKET?.get(p.objectKey);
    if (!object) throw new UserError(404, "原图暂时不可用");
    const download = new URL(request.url).searchParams.has("download");
    return new Response(object.body, {
      headers: {
        "Content-Type": p.mime,
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(p.filename)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
