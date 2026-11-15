# Mingle's Choice shop

NZD storefront, owner workspace, shared catalogue and pricing, rule-based Chinese/English chat, visitor-bound offers, cart, Stripe hosted Checkout and signed payment webhooks.

## Current state

- New Site is owner-private. A private preview is not open to customers, and Stripe cannot reach an owner-private webhook. Change the Site audience only when the owner requests customer access.
- No real product prices, stock, photographs, pickup details, shipping rates or merchant policies were supplied. The six known categories are suggestions; the owner can import them as drafts in /admin.
- Stripe account connection and runtime secrets are not configured. Checkout remains disabled. No real payment has been attempted.
- The assistant uses deterministic shop rules, not a connected language model. Unknown details and after-sales issues are saved for owner attention. The owner can reply inside the same web chat; there is no automatic email notification.

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
    npm run dev
    node --test tests/commerce.test.mjs

Apply each local migration only once. Hosted migrations are applied by Sites during deployment. Local data and tests are separate from production. Local sign-in uses the starter's loopback-only mock account; it is absent from production. Secrets, browser sessions, build state and local databases are ignored by Git.

## Validation

Integration tests execute the actual migrations and inventory triggers against an in-memory SQLite database; Stripe is an injected test transport. Browser QA covers owner login, product creation, bulk price change, price synchronization, negotiated offer/cart and a 390px mobile viewport. These checks do not replace an actual Stripe test-mode end-to-end payment.
