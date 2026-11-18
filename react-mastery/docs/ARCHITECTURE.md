# Architecture and maintenance

The hosted entry page is built from the original `index.html` and `src/main.tsx` by `hosting/build.mjs`. Owners and visitors receive byte-identical app assets, including App, LearningPaths and the original styles. There is no separate display frontend or exported catalog UI. `hosting/gateway.mjs` checks verified identity for data APIs: owner requests proxy to private storage; visitors receive the authored curriculum with empty personal records from `shared/visitor-workspace.ts`. Topic browsing uses the existing MixedPractice component. No learner data, generated AI output or credentials enter the app build. The launcher signs in and returns to the same `/` application. Frontend publication does not redeploy the private Railway service.

## Keep one deployable, separate responsibilities

This is a modular monolith: a React/TypeScript client and a local Node HTTP server. Node's built-in SQLite module stores durable learning records. Vite handles development and production assets. Browser execution is separated from persistence and AI evaluation.

- `shared/curriculum.ts`: lesson content, prerequisites, sources, practice/transfer tasks. Bump `curriculumVersion` when meaning or task behavior changes.
- `shared/mastery.ts`: pure mastery and review policy, independently testable. It must remain free of model/network/filesystem calls.
- `server/store.ts`: sessions, append-only evidence, derived progress, transactions, and schema version.
- `server/coach.ts`: Codex discovery and evaluation adapter. Keep provider-specific code here so an authenticated API adapter can replace it later.
- `server/index.ts`: request validation and stage boundaries. Re-read sessions after long AI work so concurrent hint/draft changes are not overwritten; reject an assessment against superseded code.
- `src/sandbox/runner.tsx`: actual React rendering, behavior tests, and error/loop reporting.
- `shared/paths.ts`: the versioned catalog of 27 learning paths, including mappings from original React topics to the common topic model. Performance and career topics are authored in `paths-performance.ts` and `paths-career.ts`.
- `shared/study.ts`, `server/study.ts`: current choice/code practice. The shared layer owns semantic alias rules, result validation, public projections, and per-format completion. The server owns generated content, answer keys, Codex calls, and durable sessions. Choices use stored keys without a model call. New React code tasks carry an authored challenge descriptor and run in the existing browser sandbox; matching-code reports are validated before saving. Other languages use AI code review. Old keyword grading remains only for compatibility and does not contribute to current progress.
- `shared/topic-practice.ts`, `server/topic-practice.ts`: version-one reasoning sessions, kept readable for existing history. New practice uses `/api/study/*` and a separate table rather than rewriting historical records.

## Durable evidence

Store the original code, test results, learner explanation, hints, AI rubric version, curriculum version, and evaluation time. Update the session and evidence/progress transactionally. Do not change historical grades when an authored rubric changes; create a fresh assessment under the new version.

The original schema used `PRAGMA user_version=1`. Additive migrations now create understanding sessions (v2), topic-v1 sessions (v3), and mixed-format study sessions (v4), without rewriting original records. Export includes all four record families. Future destructive schema changes need ordered migrations with backup and restore verification. Avoid replacing the database with ad hoc JSON overwrites. Never commit user work or credentials.

Generated study content stores its version, language, source topic, keys, rubric, and correct/incorrect fixtures. The public projection omits keys, aliases, fixtures, and reference code until explicitly requested. Drafts and attempts are saved before model calls; a per-session lock prevents concurrent mutations from overwriting assistance or answers. Model errors remain errors. Generated keys and fixtures are not an independently verified oracle, so AI-reviewed tasks report practice completion, not mastery or runtime test success. Browser execution reports are personal-local evidence, not hardened server-verified certification.

Behavioral interview paths declare `practiceMode: 'response'`. Their generated task carries `coding.format: 'response'` and is validated as plain text without an execution contract. The existing `code` slot in saved drafts, attempts, references and progress is reused as the second practice slot; no historical data or schema migration is required. The UI renders a normal text answer, response labels and prose references. Generation, review and follow-up coaching use dedicated nontechnical prompts; they assess evidence in the response without verifying biography or promising hiring success. Authored response scaffolds, follow-up cases and revealed references can be translated, while learner drafts, submission input and evidence quotes remain unchanged. Performance prompts require supplied measurements or mocks and never represent an AI review as actual profiling or load-test execution.

Opening a study topic starts background preparation of its immediate successor. Preparation includes both lesson generation and the exact presentation/translation batches for the selected language, including when the next topic already has a saved session. Prepared lessons remain outside learner progress until opened; concurrent preparation/open requests share generation and durable presentation caches. The browser retries transient preparation failures while the current topic stays open and prepares again after a language change. Background AI work stays in the background queue; it cannot reserve the learner-action slot. A learner who navigates before preparation finishes can still wait for that same in-flight job.

## Code execution boundary

Learner JSX runs in a sandboxed iframe with only scripts allowed, an opaque origin, no parent DOM access, a restrictive CSP, no fetch connections, and a short watchdog. Babel instruments loops/functions with execution guards. The host accepts results only from its current frame and matching random run ID.

This is a personal learning sandbox, **not a hardened hostile-code execution service**. Browser memory exhaustion, unusual native operations, and determined client-side report tampering are not fully prevented. Never execute submitted JSX inside the Node API. Before public multi-user operation, replace this boundary with isolated, resource-limited remote runners and server-verified results.

## AI boundary

Assessments use ephemeral Codex CLI invocations, shell tools off, web search disabled, empty MCP configuration, and a read-only sandbox. Student text is untrusted data. Schema validation, evidence quote verification, and application-owned gate calculations are required even if the AI says a learner passed. The adapter fails closed on authentication, quota, invalid output, or timeout errors.

## Before public hosting

The private owner-only online deployment is documented in [CLOUD.md](CLOUD.md). Sites supplies the owner sign-in boundary; the backend requires separate server keys, retains one durable SQLite account, and exposes only a minimal unauthenticated health probe. Local mode remains loopback-only. This reviewed deployment does not enable anonymous access or multi-user sharing.

Add identity and per-user authorization, account data isolation, a managed secret/AI provider boundary, external durable storage, anti-abuse and request budgets, isolated code runners, cancellation, and a complete accessibility/security review. A server with local Codex access must not be exposed to the internet or bound to `0.0.0.0`.

## Maintenance checklist for a new lesson

1. Author a narrow concept with an official source and explicit prerequisites.
2. Add retrieval variants, primary and transfer tasks, rubric, and graded hints.
3. Add correct and intentionally wrong code fixtures.
4. Verify behavior and edge cases in the browser harness.
5. Check that assistance and partial evidence cannot award mastery.
6. Update the content version and changelog; commit the completed small task locally.

## Next milestones

1. Add richer history filters and compare evidence across attempts; session-specific URLs already restore current work.
2. Add substantive per-lesson alternate problem families, generated only within reviewed task schemas.
3. Add a real delayed-review browser test using a controlled test clock and disposable database.
4. Improve editor diagnostics and provide a visible isolated preview alongside behavior checks.
5. Add advanced hooks/effect lessons and a project-level capstone with explicit acceptance tests.

PresentationCache preloads both languages into browser memory and deduplicates requests. Next-topic server preparation warms both durable language caches; speculative presentation requests use background priority.
