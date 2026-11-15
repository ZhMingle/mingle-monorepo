declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    OWNER_EMAIL?: string;
    STORE_ORIGIN?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    OPENAI_API_KEY?: string;
    PRODUCT_VISION_MODEL?: string;
    BUCKET?: R2Bucket;
  }
}
