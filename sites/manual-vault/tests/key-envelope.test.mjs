import test from "node:test";
import assert from "node:assert/strict";
import { resolveOpenAIKey } from "../lib/openai-key.ts";
test("unwraps a provisioned envelope only on the server", async () => {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const ciphertext = Buffer.from(
    await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      pair.publicKey,
      new TextEncoder().encode("sk-synthetic-test-value"),
    ),
  ).toString("base64url");
  assert.equal(
    await resolveOpenAIKey({
      OPENAI_KEY_ENVELOPE: JSON.stringify({
        version: 1,
        privateJwk,
        ciphertext,
      }),
    }),
    "sk-synthetic-test-value",
  );
  await assert.rejects(() =>
    resolveOpenAIKey({
      OPENAI_KEY_ENVELOPE: JSON.stringify({
        version: 9,
        privateJwk,
        ciphertext,
      }),
    }),
  );
  assert.equal(await resolveOpenAIKey({}), null);
});
