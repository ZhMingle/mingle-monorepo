// Runs against a loopback Vinext preview, never production. All records are
// synthetic and deleted in finally. Set LIVE_AI=1 for one billable vision call.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
const base = process.env.PREVIEW_URL || "http://127.0.0.1:4332";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw new Error("Smoke tests are restricted to local previews");
const signIn = await fetch(`${base}/signin-with-chatgpt?return_to=%2F`, {
  redirect: "manual",
});
const cookie = signIn.headers.get("set-cookie")?.split(";")[0];
assert.ok(cookie, "Local sign-in must establish a preview session");
async function call(path, { method = "GET", body, headers = {} } = {}) {
  return fetch(base + path, {
    method,
    headers: {
      Cookie: cookie,
      Origin: base,
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...headers,
    },
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
}
async function ok(response, expected = 200) {
  const body = await response.json();
  assert.equal(response.status, expected, JSON.stringify(body));
  return body;
}
assert.equal((await fetch(`${base}/api/library`)).status, 401);
assert.equal(
  (
    await fetch(`${base}/api/library`, {
      headers: {
        "oai-authenticated-user-id": "forged",
        "oai-authenticated-user-email": "forged@invalid.test",
      },
    })
  ).status,
  401,
);
assert.equal(
  (
    await call("/api/products", {
      method: "POST",
      body: { name: "X" },
      headers: { Origin: "https://untrusted.invalid" },
    })
  ).status,
  403,
);
const device = await ok(
  await call("/api/products", {
    method: "POST",
    body: {
      name: "验证用虚构音箱",
      brand: "TEST ONLY",
      model: "SAMPLE-AUDIO",
      category: "音频设备",
    },
  }),
  201,
);
try {
  await ok(
    await call(`/api/products/${device.id}`, {
      method: "PATCH",
      body: { favorite: true },
    }),
  );
  const bad = new FormData();
  bad.append(
    "file",
    new Blob(['<svg onload="evil()"/>'], { type: "image/png" }),
    "not-an-image.png",
  );
  assert.equal(
    (
      await call(`/api/products/${device.id}/pages`, {
        method: "POST",
        body: bad,
      })
    ).status,
    400,
  );
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700"><rect width="100%" height="100%" fill="white"/><g font-family="Arial" fill="#111"><text x="65" y="90" font-size="36">FICTIONAL TEST DEVICE - SAMPLE-AUDIO</text><text x="65" y="150" font-size="30">User Manual / Bluetooth Pairing</text><text x="65" y="240" font-size="28">1. Turn the speaker on.</text><text x="65" y="300" font-size="28">2. Hold the Bluetooth button for 3 seconds.</text><text x="65" y="360" font-size="28">3. Select SAMPLE-AUDIO on your phone.</text><text x="65" y="440" font-size="26">Factory Reset</text><text x="65" y="500" font-size="26">Hold Volume + and Bluetooth for 5 seconds.</text><text x="65" y="550" font-size="26">Warning: This erases all saved pairings.</text></g></svg>';
  const bytes = await sharp(Buffer.from(svg)).png().toBuffer();
  const form = new FormData();
  form.append(
    "file",
    new Blob([bytes], { type: "image/png" }),
    "synthetic-manual.png",
  );
  const page = await ok(
    await call(`/api/products/${device.id}/pages`, {
      method: "POST",
      body: form,
    }),
    201,
  );
  assert.equal(page.sha256, createHash("sha256").update(bytes).digest("hex"));
  const download = await call(`/api/pages/${page.id}/original?download`);
  assert.equal(download.status, 200);
  assert.match(download.headers.get("content-disposition"), /attachment/);
  assert.deepEqual(
    Buffer.from(await download.arrayBuffer()),
    bytes,
    "Original bytes must be preserved",
  );
  assert.equal((await call("/api/pages/missing-page/original")).status, 404);
  let ai = "skipped";
  if (process.env.LIVE_AI === "1") {
    const response = await call(`/api/pages/${page.id}/analyze`, {
      method: "POST",
    });
    const result = await response.json();
    if (response.status !== 200) {
      console.log(
        JSON.stringify({
          liveAI: "unavailable",
          status: response.status,
          message: result.error,
        }),
      );
      ai = "unavailable";
    } else {
      assert.ok(
        result.extraction.procedures.some((p) => p.kind === "bluetooth"),
      );
      assert.ok(result.extraction.procedures.some((p) => p.kind === "reset"));
      assert.match(
        result.extraction.procedures.find((p) => p.kind === "reset").warning,
        /配对|pair/i,
      );
      ai = "passed";
    }
  }
  await ok(
    await call(`/api/pages/${page.id}`, {
      method: "PATCH",
      body: { text: "Manually corrected original text." },
    }),
  );
  await ok(
    await call(`/api/pages/${page.id}`, {
      method: "PATCH",
      body: { reviewed: true },
    }),
  );
  let library = await ok(await call("/api/library"));
  assert.equal(library.products.find((p) => p.id === device.id).favorite, true);
  assert.equal(library.pages.find((p) => p.id === page.id).reviewed, true);
  await ok(
    await call(`/api/pages/${page.id}`, {
      method: "PATCH",
      body: { text: "Changed again." },
    }),
  );
  library = await ok(await call("/api/library"));
  const updated = library.pages.find((p) => p.id === page.id);
  assert.equal(updated.reviewed, false);
  assert.deepEqual(updated.extraction.procedures, []);
  console.log(
    JSON.stringify({
      auth: "passed",
      originProtection: "passed",
      uploadValidation: "passed",
      originalBytesAndDownload: "passed",
      productEdit: "passed",
      sourceCorrectionInvalidation: "passed",
      liveAI: ai,
    }),
  );
} finally {
  await ok(await call(`/api/products/${device.id}`, { method: "DELETE" }));
  const library = await ok(await call("/api/library"));
  assert.ok(!library.products.some((p) => p.id === device.id));
  assert.ok(!library.pages.some((p) => p.productId === device.id));
  console.log("Synthetic local records removed.");
}
