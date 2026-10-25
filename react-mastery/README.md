# Clarity — React Mastery Lab

A local-first AI learning platform for React. A topic is assessed through independent prediction, real React code checks, explanation, transfer, and delayed recall. Watching a lesson or asking the AI to mark a checkbox never awards mastery.

## First version

- Six complete learning labs: components/props, state snapshots and batching, immutable updates, stable keys, derived data, and reducers.
- A five-step flow: **Understand → Predict → Build → Explain → Transfer**.
- Explain and transfer explanations include concrete answer requirements, passing criteria, and authored reference answers. Viewing a reference is recorded as assisted practice and never replaces a draft or grants independent mastery. Reference answers do not call a model.
- Both coding editors expose task hints and reference code before a passing test run. Transfer hints address the new task specifically; each learning area has its own hint progression.
- Real JSX execution in an opaque-origin browser sandbox. Correct solutions, broken starters, and transfer variants are covered by a browser regression harness.
- Real Codex evaluation using the existing local ChatGPT sign-in, without an API key. Only submitting an explanation invokes the model; reading and code tests do not.
- Four explanation dimensions, each 0–3: correctness, causality, clarity, transfer. AI must quote actual learner text. A score alone is insufficient.
- Independent proof requires all evidence gates, a correct first prediction, and no recorded hints in that attempt. Assisted practice remains useful but cannot award independent proof.
- Initial success is **provisional**. Delayed review supplies additional retention evidence. Early practice cannot pretend to be delayed recall or postpone review deadlines.
- SQLite learning records, draft autosave, an evidence journal, and full JSON export.
- English interface, lessons, exercises, hints, and AI feedback. Learners may answer in any language; quoted evidence preserves their original words. Existing learning records remain unchanged.

Later advanced topics are visibly marked **Planned**. This version does not claim to contain a complete advanced React curriculum or guarantee permanent mastery.

## Run locally

Requires **Node.js 24+**, a modern browser, and an installed Codex CLI signed in with ChatGPT.

```powershell
pnpm install
pnpm dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317). For a production build:

```powershell
pnpm build
pnpm start
```

On this computer, **double-click `Start.bat` in File Explorer** to open the built application. The launcher finds the bundled Node runtime when normal Node is unavailable. `Start.bat` does not run inside the Codex file editor; open the containing folder to launch it.

When reinstalling with a package manager that requires approval for build scripts, approve the official `esbuild` package. The committed lockfile records the dependency versions.

## Local AI connection

Rise and this application are separate projects. Clarity discovers `codex.exe` through PATH or the desktop app installation under `%LOCALAPPDATA%\OpenAI\Codex\bin`. Set `CODEX_BIN` to a specific executable if necessary. A detected installation is not proof of a valid login; the first real assessment verifies the connection.

For each assessment the server starts an ephemeral Codex CLI invocation with user configuration ignored, shell tools disabled, web search disabled, no MCP servers, and a read-only sandbox. The model receives the authored reference, submitted code/test report, rubric, and learner explanation. It returns schema-constrained feedback, which the server validates independently. Login credentials are managed by Codex and are never copied into browser code or this repository.

AI assessments consume the signed-in account's Codex allowance. An unavailable login, exhausted allowance, network failure, or invalid model output produces an explicit error; the draft remains saved and no fabricated grade is substituted. One AI assessment runs at a time, with a timeout.

## Data and privacy

The server listens only on `127.0.0.1`. It validates the Host and mutating request origin and does not enable cross-origin API access. This is a **single-user local application**, not an internet-ready multi-user service.

Learning data is stored at `data/learning.sqlite`, with WAL enabled. `data/` is ignored by Git. Export all sessions and evidence with the download button or `/api/export`. The evidence journal shows the most recent 40 sessions; the export includes all sessions. To make an exact database backup, stop the server and copy the complete data directory, including any WAL files.

Only actively submitted code and explanation are sent to Codex for assessment. The platform does not read your other chats. Exported evidence contains your submitted work; store it as personal data.

## Validation

```powershell
pnpm test
pnpm build
# Optional: one real AI request, using Codex allowance
node scripts/verify-ai.ts
# Optional: create a temporary browser verification page after building
node scripts/build-qa.mjs
```

With the server running, open `/sandbox-qa.html` and choose **Run all sandbox checks**. The page uses synthetic fixtures and does not create learner records or call AI. A normal production build removes those temporary QA files.

The domain tests cover independent evidence, hint contamination, first-answer correctness, unavailable evidence, grounded AI quotes, review scheduling, and six playable lessons. The browser harness checks 12 correct/transfer solutions, six broken starters, and loop protection.

## Project layout

```text
shared/             Versioned curriculum, challenge definitions, types, mastery rules
server/             Local HTTP API, SQLite persistence, Codex adapter
src/                React application and UI
src/sandbox/        Opaque-frame React execution harness
tests/              Domain tests and synthetic code fixtures
scripts/            Build and verification helpers
docs/               Product decisions and long-term maintenance plan
data/               Local data; never committed
```

See [product principles](docs/PRODUCT.md) and [architecture and maintenance](docs/ARCHITECTURE.md).
