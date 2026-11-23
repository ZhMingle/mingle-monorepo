// A connector envelope lets provisioning pass ciphertext to Sites without
// exposing a plaintext API key in orchestration output. The entire envelope,
// including its unwrap key, must be stored as one Sites runtime secret.
export async function resolveOpenAIKey(config: {
  OPENAI_API_KEY?: string;
  OPENAI_KEY_ENVELOPE?: string;
}): Promise<string | null> {
  if (config.OPENAI_API_KEY) return config.OPENAI_API_KEY;
  if (!config.OPENAI_KEY_ENVELOPE) return null;
  const envelope = JSON.parse(config.OPENAI_KEY_ENVELOPE) as {
    version: number;
    ciphertext: string;
    privateJwk: JsonWebKey;
  };
  if (envelope.version !== 1)
    throw new Error("Unsupported credential envelope");
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    envelope.privateJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"],
  );
  const encoded = envelope.ciphertext.replaceAll("-", "+").replaceAll("_", "/");
  const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    bytes,
  );
  const key = new TextDecoder().decode(plaintext);
  if (!/^sk-[A-Za-z0-9_-]+$/.test(key))
    throw new Error("Invalid credential envelope");
  return key;
}
