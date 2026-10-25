# Architecture and maintenance

## Keep one deployable, separate responsibilities

This is a modular monolith: a React/TypeScript client and a local Node HTTP server. Node's built-in SQLite module stores durable learning records. Vite handles development and production assets. Browser execution is separated from persistence and AI evaluation.

- `shared/curriculum.ts`: lesson content, prerequisites, sources, practice/transfer tasks. Bump `curriculumVersion` when meaning or task behavior changes.
- `shared/mastery.ts`: pure mastery and review policy, independently testable. It must remain free of model/network/filesystem calls.
- `server/store.ts`: sessions, append-only evidence, derived progress, transactions, and schema version.
- `server/coach.ts`: Codex discovery and evaluation adapter. Keep provider-specific code here so an authenticated API adapter can replace it later.
- `server/index.ts`: request validation and stage boundaries. Re-read sessions after long AI work so concurrent hint/draft changes are not overwritten; reject an assessment against superseded code.
- `src/sandbox/runner.tsx`: actual React rendering, behavior tests, and error/loop reporting.

## Durable evidence

Store the original code, test results, learner explanation, hints, AI rubric version, curriculum version, and evaluation time. Update the session and evidence/progress transactionally. Do not change historical grades when an authored rubric changes; create a fresh assessment under the new version.

The initial SQLite migration sets `PRAGMA user_version=1`. Future schema changes need ordered migrations with backup and restore verification. Avoid replacing the database with ad hoc JSON overwrites. Never commit user work or credentials.

## Code execution boundary

Learner JSX runs in a sandboxed iframe with only scripts allowed, an opaque origin, no parent DOM access, a restrictive CSP, no fetch connections, and a short watchdog. Babel instruments loops/functions with execution guards. The host accepts results only from its current frame and matching random run ID.

This is a personal learning sandbox, **not a hardened hostile-code execution service**. Browser memory exhaustion, unusual native operations, and determined client-side report tampering are not fully prevented. Never execute submitted JSX inside the Node API. Before public multi-user operation, replace this boundary with isolated, resource-limited remote runners and server-verified results.

## AI boundary

Assessments use ephemeral Codex CLI invocations, shell tools off, web search disabled, empty MCP configuration, and a read-only sandbox. Student text is untrusted data. Schema validation, evidence quote verification, and application-owned gate calculations are required even if the AI says a learner passed. The adapter fails closed on authentication, quota, invalid output, or timeout errors.

## Before public hosting

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
