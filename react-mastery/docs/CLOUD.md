# Private online Clarity

Online workspace: https://clarity-learning-lab-mingle.minglezhang7.chatgpt.site. Sign in with the owner's existing ChatGPT account. `Start.bat` opens this address and starts the local bridge once its ignored configuration has been installed.

The existing owner-only Clarity Site provides ChatGPT sign-in. Its Worker proxies to a Railway Node 24 service using a server-only key. All app assets and learning APIs on the direct Railway address require that key. The minimal `/healthz` probe reveals no learning data. The Site's audience remains owner-only; this is one private learning account, not a public multi-user platform.

The Node backend uses a single replica and an attached persistent volume at `/data` for SQLite. Deployments exclude local `data/`, `.env` files and Codex credentials. User JSX remains in the opaque browser sandbox; the authenticated parent loads the trusted runner before embedding it, so the sandbox never needs access to sign-in cookies.

## Progress migration

`scripts/migrate-cloud.ts` makes an online SQLite backup including WAL contents, checks integrity and sends a schema-checked snapshot over HTTPS. Its configuration is supplied on stdin. The cloud importer uses parameterized inserts and one transaction, checks foreign keys, records a SHA-256 digest and row counts, and rejects an occupied destination or a second import. Learning records never enter Git, Docker images or Site source archives. A local backup and migration receipt remain under ignored `data/backups/`.

Request bodies are decoded once after buffering bytes, so network chunks cannot split and corrupt UTF-8 text. The importer recomputes its digest from stored rows before committing. For a failed initial migration, `--repair` additionally requires every cloud application record to still match the original import receipt, retains a complete cloud backup and receipt history, and refuses to replace any newer learner edit.

Use the online address for future learning on both phone and computer. The old local database is a separate retained backup; it does not bidirectionally merge changes made after migration. Avoid editing the same answer simultaneously on two devices. Server-side drafts and results persist across browser changes. UI preferences and follow-up chat history that were browser-local remain browser-local.

## AI connection

No paid API is enabled. Run `Start-Cloud-Bridge.bat` on the signed-in computer and keep it awake. A background helper polls authenticated jobs from the backend and uses the existing restricted Codex adapter. Codex login files stay on the computer. Requests retain the interactive/background queue and output validation. The cloud stores short-lived pending jobs and lease tokens, removes completed results, and reports an explicit connection or timeout error when unavailable. Saved lessons, answer keys, drafts and progress remain online when the computer is offline; new generation, translation, review and follow-up need it.

The ignored `data/cloud-bridge.json` stores the bridge origin and scoped bridge key. It cannot access the learning-data APIs or import endpoint. Proxy, bridge and one-time migration keys are distinct. Secrets are configured only in Railway/Sites runtime settings. `/api/bridge/*` and `/api/admin/*` are blocked by the Site proxy.

## Operations

Railway project: `c3bb91cd-fa43-4eb6-ad92-d3a0f08fb9c9`; production environment: `f916844a-13f5-4f85-b524-31c2a0a312a8`; service: `0797c516-e592-4a5e-8069-6dcf1fce76da`. Source root is `/react-mastery` in the tracked monorepo. The 500 MB volume is `clarity-progress`; scale it before it fills, without adding replicas against the same SQLite file. Hosting has its own service charges, separate from AI usage.

Keep the Site owner-only and its backend key secret. Public sharing or additional users require a new authorization and data-isolation design. Changing AI providers or enabling a paid API is a separate configuration decision. Export learning records regularly; platform volume backups can be configured through Railway's supported backup controls.
