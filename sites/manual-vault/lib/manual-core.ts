import {
  categories,
  type Extraction,
  type Product,
  type ManualPage,
} from "./manual-types.ts";
export class UserError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export function aiServiceError(
  status: number,
  detail?: { code?: string; type?: string },
) {
  if (
    detail?.type === "insufficient_quota" ||
    [
      "insufficient_quota",
      "credit_balance_exhausted",
      "billing_hard_limit_reached",
    ].includes(detail?.code ?? "")
  )
    return new UserError(
      402,
      "当前 OpenAI API 项目额度不足。原图已保存，启用 API 额度后可重新整理。",
    );
  if (status === 429)
    return new UserError(429, "AI 请求过于频繁，原图已保存，请稍后再试");
  if (status === 401 || status === 403)
    return new UserError(503, "AI 服务授权不可用，请检查服务配置");
  return new UserError(502, "AI 服务暂时无法整理，原图已保存，请稍后重试");
}
export function imageMime(data: Uint8Array): string | null {
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff)
    return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => data[i] === n))
    return "image/png";
  if (
    new TextDecoder().decode(data.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(data.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}
function field(value: unknown, limit: number, name: string, required = false) {
  if (
    typeof value !== "string" ||
    value.length > limit ||
    (required && !value.trim())
  )
    throw new UserError(400, `${name}格式不正确或超过长度限制`);
  return value.trim();
}
export function productInput(input: Record<string, unknown>) {
  const category = input.category ?? "其他设备";
  if (!categories.includes(category as (typeof categories)[number]))
    throw new UserError(400, "请选择有效的设备分类");
  if (input.favorite !== undefined && typeof input.favorite !== "boolean")
    throw new UserError(400, "收藏状态不正确");
  return {
    name: field(input.name, 100, "产品名称", true),
    brand: field(input.brand ?? "", 80, "品牌"),
    model: field(input.model ?? "", 100, "型号"),
    category: category as (typeof categories)[number],
    notes: field(input.notes ?? "", 4000, "备注"),
    favorite: input.favorite === true,
  };
}
const compact = (text: string) =>
  text.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
export function validExtraction(value: unknown): Extraction {
  if (!value || typeof value !== "object")
    throw new UserError(502, "整理结果不完整，请重新尝试");
  const v = value as Record<string, unknown>;
  const text = field(v.text, 24000, "识别文本"),
    summary = field(v.summary, 1600, "摘要");
  if (
    !Array.isArray(v.features) ||
    !Array.isArray(v.procedures) ||
    typeof v.unreadable !== "boolean"
  )
    throw new UserError(502, "整理结果格式有误，请重试");
  if (v.features.length > 30 || v.procedures.length > 30)
    throw new UserError(502, "单页整理结果过多，请分开上传");
  const evidence = (item: Record<string, unknown>) => {
    const quote = field(item.evidence, 2000, "原文引用", true);
    if (!compact(text).includes(compact(quote)))
      throw new UserError(
        502,
        "整理结果的引用无法在识别原文中找到，请重试或补拍清晰照片",
      );
    return quote;
  };
  return {
    text,
    summary,
    unreadable: v.unreadable,
    features: v.features.map((f: Record<string, unknown>) => ({
      title: field(f.title, 200, "功能", true),
      evidence: evidence(f),
    })),
    procedures: v.procedures.map((p: Record<string, unknown>) => {
      if (
        !["bluetooth", "reset", "stereo", "mode", "other"].includes(
          p.kind as string,
        ) ||
        !Array.isArray(p.steps) ||
        p.steps.length < 1 ||
        p.steps.length > 20
      )
        throw new UserError(502, "操作步骤格式有误");
      return {
        title: field(p.title, 200, "操作标题", true),
        kind: p.kind as Extraction["procedures"][number]["kind"],
        steps: p.steps.map((s) => field(s, 1200, "操作步骤", true)),
        warning: field(p.warning, 1200, "注意事项"),
        evidence: evidence(p),
      };
    }),
  };
}
const str = { type: "string" };
const object = (properties: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required: Object.keys(properties),
});
export const extractionSchema = object({
  text: str,
  summary: str,
  unreadable: { type: "boolean" },
  features: { type: "array", items: object({ title: str, evidence: str }) },
  procedures: {
    type: "array",
    items: object({
      title: str,
      kind: {
        type: "string",
        enum: ["bluetooth", "reset", "stereo", "mode", "other"],
      },
      steps: { type: "array", items: str },
      warning: str,
      evidence: str,
    }),
  },
});
const intents = [
  {
    kind: "bluetooth",
    words: ["蓝牙", "bluetooth", "配对", "pair", "连接手机"],
  },
  {
    kind: "reset",
    words: ["恢复出厂", "重置", "reset", "清除配对", "恢复设置"],
  },
  {
    kind: "stereo",
    words: ["串联", "立体声", "tws", "stereo", "双音箱", "双音响"],
  },
  { kind: "mode", words: ["切换", "模式", "mode", "有线", "无线", "2.4g"] },
];
export function searchLibrary(
  query: string,
  products: Product[],
  pages: ManualPage[],
) {
  const q = compact(query.trim());
  if (!q) return [];
  const kinds = intents
    .filter((i) => i.words.some((w) => q.includes(compact(w))))
    .map((i) => i.kind);
  const terms = query
    .toLowerCase()
    .split(/[\s，,。？?]+/)
    .filter(Boolean);
  const named = products.filter((p) =>
    [p.name, p.brand, p.model].some(
      (value) => value.trim().length >= 2 && q.includes(compact(value)),
    ),
  );
  const categoryIntent = [
    { category: "键盘与外设", terms: ["键盘", "鼠标"] },
    { category: "音频设备", terms: ["音箱", "音响", "耳机"] },
    { category: "影像设备", terms: ["相机", "摄像"] },
  ].find((group) => group.terms.some((term) => q.includes(term)));
  const candidates = named.length
    ? named
    : categoryIntent
      ? products.filter((p) => p.category === categoryIntent.category)
      : products;
  return candidates
    .map((product) => {
      const owned = pages.filter((p) => p.productId === product.id);
      const guides = owned
        .flatMap((page) =>
          (page.extraction?.procedures ?? []).map((procedure) => ({
            page,
            procedure,
          })),
        )
        .filter(({ procedure }) =>
          kinds.length
            ? kinds.includes(procedure.kind)
            : compact(
                procedure.title +
                  procedure.evidence +
                  procedure.steps.join(" "),
              ).includes(q),
        );
      const source = compact(
        [
          product.name,
          product.brand,
          product.model,
          product.notes,
          ...owned.map((p) => p.extraction?.text ?? ""),
        ].join(" "),
      );
      return {
        product,
        guides,
        matched:
          source.includes(q) ||
          terms.every((t) => source.includes(compact(t))) ||
          guides.length > 0,
      };
    })
    .filter((r) => r.matched)
    .sort((a, b) => b.guides.length - a.guides.length);
}
