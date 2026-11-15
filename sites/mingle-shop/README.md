# Mingle's Choice shop

NZD storefront, owner workspace, shared catalogue and pricing, rule-based Chinese/English chat, visitor-bound offers, cart, Stripe hosted Checkout and signed payment webhooks.

## Mobile publishing

The owner workspace is mobile first, with a fixed bottom navigation and product/order cards. Add the Site to the phone home screen for standalone access. Only the generic offline notice is cached; login, customer data, admin pages, media and API responses are not cached by the service worker.

When opened in a regular browser, the owner workspace offers “全屏管理” if the browser allows the Fullscreen API. Clicking it requests fullscreen for the document with navigationUI=hide; “退出全屏” exits without reloading. The UI follows the browser's actual fullscreen state. Fullscreen requires a user gesture and may end when changing apps or leaving the page. It cannot be forced on launch or guaranteed in every embedded browser. The install manifest link uses crossorigin=use-credentials because this Site's private access gate also protects the manifest. The manifest and Site audience remain unchanged.

The product editor accepts camera photos, album selections and video files. Photos are resized to at most 1536px and converted to JPEG in the browser, removing the original photo metadata. Images are limited to 5 MB after conversion; videos to 50 MB. Each product supports up to 8 photos and 2 videos. MP4, MOV and WebM are stored in R2 without transcoding; playback depends on the recording codec and the customer's browser. Video delivery supports HEAD and single byte ranges for seeking.

Uploaded media stays private to the owner until attached to a published product. Removing a media entry detaches it on save; this version does not automatically purge unused uploaded objects. Existing HTTPS product-image URLs remain supported.

Photo listing generation defaults to New Zealand English. Configure OPENAI_API_KEY as a secret using the OpenAI Developers plugin workflow; PRODUCT_VISION_MODEL defaults to gpt-4.1-mini. Up to three stored images are sent to the OpenAI Responses API per request, with structured output and store=false. AI service usage has separate API costs. Owner authentication, a request limit, upload validation and server-side output checks apply. There is no fake generation fallback when the connection is missing.

After uploading photos, generation runs automatically when enabled. Empty title/description fields are filled; existing copy and any text typed while generation runs are preserved. The owner can explicitly regenerate, apply a new draft and edit all text. The model is instructed not to infer specifications, condition, stock or price. Only the owner enters NZD price and inventory. Video itself is not used for AI copy generation.

## Current state

- New Site is owner-private. A private preview is not open to customers, and Stripe cannot reach an owner-private webhook. Change the Site audience only when the owner requests customer access.
- No real product prices, stock, photographs, pickup details, shipping rates or merchant policies were supplied. The six known categories are suggestions; the owner can import them as drafts in /admin.
- Stripe account connection and runtime secrets are not configured. Checkout remains disabled. No real payment has been attempted.
- The assistant uses deterministic shop rules, not a connected language model. Unknown details and after-sales issues are saved for owner attention. The owner can reply inside the same web chat; there is no automatic email notification.
- Product-photo AI generation is a separate feature from customer chat. Its API connection must be configured before real photo generation can run.

## Owner workflow

Open /admin, sign in with the configured owner account, import the six categories or add a product, and set actual price, stock, image URL and optional negotiation/quantity rules. Saving or bulk-changing prices updates the catalogue and future chat/checkout calculations. Offers expire after 15 minutes and are invalidated by product edits. Browser-local shopping bags are not orders; products, quotes, chats and orders persist in D1.

Fill in contact email, fulfilment arrangements, and the shop's own return/privacy policies. All product amounts are final NZD unit amounts. Automatic tax calculation is not enabled; the merchant must confirm its own tax treatment before opening checkout.

## Stripe setup

Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET as secret runtime variables using the Sites environment settings. STORE_ORIGIN is the exact deployed HTTPS origin. OWNER_EMAIL is the initial server-side owner allowlist and must match the authenticated owner.

Once the owner has requested public/customer access, register https://<site-origin>/api/stripe/webhook in Stripe for checkout.session.completed, checkout.session.async_payment_succeeded, and checkout.session.expired. Use test credentials first and perform a real Stripe test-mode checkout. Verify the order and inventory, then configure matching live-mode credentials and webhook before accepting real sales. Do not paste keys into chat, source, screenshots or commit history.

Payment totals are rebuilt server-side. Checkout uses Stripe idempotency keys and persisted parameters. D1 reservation triggers run in the order-creation batch: a failed multi-item reservation rolls everything back. Only a correctly signed, amount/currency/mode-matched paid event (or authenticated Stripe session reconciliation) marks an order paid and deducts stock. Duplicate events do not deduct twice. Expiration/definitive session-creation failures release reservations. Ambiguous network failures retain reservations for retry using the same checkout attempt. The owner can reconcile an unresolved order from its detail dialog.

Do not fulfil orders labelled “付款需核对”. Refunds are handled in Stripe and require manual order/inventory reconciliation in this version. Inventory is never restored merely because a refund was requested.

## Local work

Node >=22.13, preferably Node 24.

    npm run install:ci
    npm run db:generate
    npm run build
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_perfect_grim_reaper.sql
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_deep_deathbird.sql
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_funny_shadowcat.sql
    npm run dev
    node --test tests/*.test.mjs

Apply each local migration only once. Hosted migrations are applied by Sites during deployment. Local data and tests are separate from production. Local sign-in uses the starter's loopback-only mock account; it is absent from production. Secrets, browser sessions, build state and local databases are ignored by Git.

## Validation

Integration tests execute the actual migrations and inventory triggers against an in-memory SQLite database; Stripe is an injected test transport. Browser QA covers owner login, product creation, bulk price change, price synchronization, negotiated offer/cart and a 390px mobile viewport. These checks do not replace an actual Stripe test-mode end-to-end payment.

Mobile media validation adds authenticated image/video uploads, MIME and byte checks, size mismatch cleanup, draft visibility, duplicate attachment rejection, video ranges and HEAD requests, and explicit AI failure handling. Vision tests use an injected OpenAI transport; real photo generation has not been verified without an API connection. Browser QA also uploads a synthetic photo and a recorded WebM clip, saves a draft, publishes it only in the local preview database, and verifies customer-gallery playback. The synthetic media and local data are excluded from publication and Git.

Fullscreen browser QA verifies an actual html:fullscreen match on entry, zero fullscreen matches on exit, and a single credentialed manifest link in the rendered page. This is browser verification with a mobile viewport, not an on-device Android installation test.
