import test from "node:test";
import assert from "node:assert/strict";
import {
  imageMime,
  productInput,
  searchLibrary,
  validExtraction,
  aiServiceError,
} from "../lib/manual-core.ts";
test("distinguishes exhausted API balance from transient rate limits", () => {
  assert.equal(
    aiServiceError(429, {
      code: "credit_balance_exhausted",
      type: "insufficient_quota",
    }).status,
    402,
  );
  assert.equal(aiServiceError(429, { code: "insufficient_quota" }).status, 402);
  assert.equal(
    aiServiceError(429, { code: "rate_limit_exceeded" }).status,
    429,
  );
  assert.equal(aiServiceError(401).status, 503);
  assert.equal(aiServiceError(500).status, 502);
});
const text =
  "Pairing: Hold BT for 3 seconds. Select SAMPLE. Reset: Hold + and BT for 5 seconds. All pairings will be erased.";
const extraction = {
  text,
  summary: "蓝牙配对与恢复出厂",
  unreadable: false,
  features: [],
  procedures: [
    {
      title: "蓝牙配对",
      kind: "bluetooth",
      steps: ["长按 BT 3 秒。", "选择 SAMPLE。"],
      warning: "",
      evidence: "Pairing: Hold BT for 3 seconds. Select SAMPLE.",
    },
  ],
};
test("accepts source-language citations and rejects invented or translated evidence", () => {
  assert.equal(validExtraction(extraction).procedures.length, 1);
  assert.throws(
    () =>
      validExtraction({
        ...extraction,
        procedures: [
          { ...extraction.procedures[0], evidence: "长按蓝牙键三秒" },
        ],
      }),
    /引用无法/,
  );
  assert.throws(() =>
    validExtraction({
      ...extraction,
      procedures: [{ ...extraction.procedures[0], evidence: "" }],
    }),
  );
});
test("evidence tolerates OCR line breaks", () =>
  assert.equal(
    validExtraction({
      ...extraction,
      text: text.replace("3 seconds", "3\nseconds"),
    }).procedures[0].kind,
    "bluetooth",
  ));
test("unclear pages do not fabricate instructions", () => {
  assert.deepEqual(
    validExtraction({
      text: "[看不清]",
      summary: "请补拍",
      unreadable: true,
      features: [],
      procedures: [],
    }).procedures,
    [],
  );
  assert.throws(
    () =>
      validExtraction({
        ...extraction,
        procedures: [{ ...extraction.procedures[0], steps: [] }],
      }),
    /步骤格式/,
  );
});
test("validates product names, categories and boolean values", () => {
  assert.equal(productInput({ name: "  书桌音箱  " }).name, "书桌音箱");
  for (const data of [
    { name: "" },
    { name: "X", category: "invalid" },
    { name: "X", favorite: "false" },
    { name: "X", notes: "n".repeat(4001) },
  ])
    assert.throws(() => productInput(data));
});
test("checks image bytes rather than trusting extensions", () => {
  assert.equal(
    imageMime(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/png",
  );
  assert.equal(imageMime(Uint8Array.from([255, 216, 255, 224])), "image/jpeg");
  assert.equal(
    imageMime(new TextEncoder().encode("RIFF1234WEBP")),
    "image/webp",
  );
  assert.equal(
    imageMime(new TextEncoder().encode('<svg onload="evil()">')),
    null,
  );
  assert.equal(imageMime(new Uint8Array()), null);
});
const product = {
  id: "speaker",
  name: "旅行音箱",
  brand: "EXAMPLE",
  model: "DEMO-1",
  category: "音频设备",
  favorite: true,
  notes: "",
  createdAt: "",
  updatedAt: "",
};
const page = { id: "p1", productId: "speaker", extraction };
test("finds Bluetooth questions and leaves unsupported procedures empty", () => {
  assert.equal(
    searchLibrary("怎么连蓝牙", [product], [page])[0].guides[0].procedure.title,
    "蓝牙配对",
  );
  assert.equal(searchLibrary("怎么串联两个音响", [product], [page]).length, 0);
  assert.equal(searchLibrary("example demo-1", [product], [page]).length, 1);
  assert.equal(searchLibrary("   ", [product], [page]).length, 0);
  assert.equal(searchLibrary("nothing", [product], [page]).length, 0);
});
test("does not borrow another product’s matching instructions", () => {
  const second = { ...product, id: "keyboard", name: "键盘" };
  assert.deepEqual(
    searchLibrary("蓝牙", [product, second], [page]).map((r) => r.product.id),
    ["speaker"],
  );
  assert.deepEqual(
    searchLibrary(
      "键盘怎么连蓝牙",
      [product, { ...second, category: "键盘与外设" }],
      [page],
    ),
    [],
  );
});
