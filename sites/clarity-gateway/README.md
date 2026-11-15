# Clarity private gateway

The existing owner-private Clarity Site authenticates visitors with ChatGPT, then proxies the app to its Railway backend using a server-only key. Keep the Site audience owner-only. The Railway backend rejects unauthenticated direct access to all assets and APIs except its minimal health probe. Internal migration and Codex bridge routes are never proxied.

Runtime secrets: `CLARITY_BACKEND_ORIGIN`, `CLARITY_PROXY_KEY`. Credentials, learning data and Codex sign-in files are never committed or included in the Site artifact. The original learning app and database remain in `react-mastery` and its attached persistent volume.

Build: `node scripts/build-gateway.mjs`. Publish the matching pushed Site source through the Sites workflow. `.sites-checkout/` contains the separate hosted-source repository and is ignored by the monorepo.
