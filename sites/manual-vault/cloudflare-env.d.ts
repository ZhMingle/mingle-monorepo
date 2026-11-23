declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OPENAI_API_KEY?: string;
    OPENAI_KEY_ENVELOPE?: string;
    OPENAI_MODEL?: string;
  }
}
