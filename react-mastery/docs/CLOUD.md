# Private online Clarity

Application: https://clarity-learning-lab-mingle.minglezhang7.chatgpt.site/. Everyone loads the original app, sidebar, learning desk, LearningPaths and styles from one build. There is no separate display page. Anyone can open all 36 paths and 837 topics without signing in; `/#roadmap/git` opens that route directly.

`Start.bat` starts the configured bridge, then activates and refreshes an existing browser tab for the configured Clarity site. It opens a new tab through `?workspace=1` only when it finds no matching tab, initiating the owner's ChatGPT sign-in before returning to `/`. The gateway serves the same frontend to the owner and other visitors. Verified ownership gates personal API data, not a different page. Anonymous bootstrap/progress endpoints contain authored curriculum and no personal records; personal writes, exports and AI are unavailable without owner identity. Visitor topic browsing stays in the original practice workspace and displays authored goals, understanding checks and references without fabricating an AI exercise.

The Clarity Site provides ChatGPT sign-in. Every personal API request requires a verified Sites user ID and an exact match to the configured owner email. The Worker proxies authorized requests to a Railway Node 24 service using a server-only key. Direct Railway assets and learning APIs still require that key. The minimal `/healthz` probe reveals no learning data. Publishing the common frontend does not change the private backend's source or deployment.

The Node backend uses a single replica and an attached persistent volume at `/data` for SQLite. Deployments exclude local `data/`, `.env` files and Codex credentials. User JSX remains in the opaque browser sandbox; the authenticated parent loads the trusted runner before embedding it, so the sandbox never needs access to sign-in cookies.

## Progress migration

`scripts/migrate-cloud.ts` makes an online SQLite backup including WAL contents, checks integrity and sends a schema-checked snapshot over HTTPS. Its configuration is supplied on stdin. The cloud importer uses parameterized inserts and one transaction, checks foreign keys, records a SHA-256 digest and row counts, and rejects an occupied destination or a second import. Learning records never enter Git, Docker images or Site source archives. A local backup and migration receipt remain under ignored `data/backups/`.

Request bodies are decoded once after buffering bytes, so network chunks cannot split and corrupt UTF-8 text. The importer recomputes its digest from stored rows before committing. For a failed initial migration, `--repair` additionally requires every cloud application record to still match the original import receipt, retains a complete cloud backup and receipt history, and refuses to replace any newer learner edit.

Use the online address for future learning on both phone and computer. The old local database is a separate retained backup; it does not bidirectionally merge changes made after migration. Avoid editing the same answer simultaneously on two devices. Server-side drafts and results persist across browser changes. UI preferences and follow-up chat history that were browser-local remain browser-local.

## AI connection

For browser-only AI, set `OPENAI_API_KEY` and `CLARITY_OPENAI_MODEL` on the private Railway service. Select a model that supports Responses API Structured Outputs with Clarity's schema constraints. Keep the key in Railway runtime secrets. ChatGPT sign-in verifies workspace access. Model requests use the server's OpenAI API project and its billing. The backend requests strict JSON with response storage disabled and retains the existing queue and output validation.

When those variables are absent, the existing operator-managed Codex bridge can still serve this workspace. Saved lessons and drafts remain available when AI is unavailable.

The ignored `data/cloud-bridge.json` stores the bridge origin and scoped bridge key. It cannot access the learning-data APIs or import endpoint. Proxy, bridge and one-time migration keys are distinct. Secrets are configured only in Railway/Sites runtime settings. `/api/bridge/*` and `/api/admin/*` are blocked by the Site proxy.

## Operations

Railway project: `c3bb91cd-fa43-4eb6-ad92-d3a0f08fb9c9`; production environment: `f916844a-13f5-4f85-b524-31c2a0a312a8`; service: `0797c516-e592-4a5e-8069-6dcf1fce76da`. Source root is `/react-mastery` in the tracked monorepo. The 500 MB volume is `clarity-progress`; scale it before it fills, without adding replicas against the same SQLite file. Hosting has its own service charges, separate from AI usage.

Keep personal routes owner-only and its backend key secret. The Site's public audience permits curriculum browsing only; additional server-side learner accounts require a new authorization and data-isolation design. Changing AI providers or enabling a paid API is a separate configuration decision. Export learning records regularly; platform volume backups can be configured through Railway's supported backup controls.
