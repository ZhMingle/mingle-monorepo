# Clarity — Developer Learning Lab

A local-first AI learning platform for React, TypeScript, HTML/CSS, C#/.NET, MySQL, SQL Server, and PostgreSQL. A topic is assessed through independent prediction, real React code checks, explanation, transfer, and delayed recall. Watching a lesson or asking the AI to mark a checkbox never awards mastery.

## Current learning experience

All seven paths (78 topics) now use **English keyword blanks + practical multiple choice + editable coding tasks**. No long written rationale is required. Keyword scoring accepts equivalent English technical names and noun/adjective forms (for example, idempotent / idempotence / idempotency). Known aliases are checked locally; unfamiliar wording uses AI semantic review only on explicit submission. Choice checks use the saved key. Coding tasks use explicit cases and AI code review; they are not executed.

Sessions resume with drafts, current question type, and submission history. Reference views mark supported practice without replacing the learner draft. Completion is recorded per question type and is not promoted to mastery/retention. The original executable React labs and earlier reasoning sessions remain accessible separately; their history is preserved.

## Original React labs

- **Understanding Lab** (`/#lab`): an experienced-learner experiment for state snapshots and update queues. Three short probes vary the inputs and operation order. Numbers and repair choices are checked deterministically; Codex evaluates the explanation with a verbatim evidence quote. Correct predictions alone, fluency, and generic recall cannot verify a probe.
- A failed probe gets one focused clarification rather than requiring the whole explanation again. Earlier answers remain saved. Help and evaluated retries remain supported practice, and users can continue with an explicit gap. This is evidence for one narrow skill, not a general mastery certificate.
- Independent success across all three probes opens a delayed check after 24 hours. Early practice cannot grant retention evidence; reviews use a fresh parameter combination. The older six-lab flow remains available.
- Optional **voice input** uses the browser's SpeechRecognition/webkitSpeechRecognition API, not Codex audio access. It starts only after opt-in and a user click, can be stopped, and produces editable text before submission. Browser recognition can send audio to the browser provider's speech service and may be unavailable or fail even if the API exists. Text entry always remains available. Question read-out uses speechSynthesis when present. No audio recordings are stored by this application. See [MDN's browser support and privacy notes](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
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
- A persistent English/Chinese switch covers the interface, lessons, exercises, hints, and reference answers. New AI feedback follows the selected language. Learners may answer in any language; code, drafts, quoted evidence, and historical feedback remain unchanged.

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
## Learning paths

Open **Learning paths** for React, TypeScript, HTML/CSS, C#/.NET, MySQL, SQL Server, and PostgreSQL. Search topics or filter by frontend, backend, and databases. Paths have stable links such as `/#roadmap/typescript`.

The six new paths each contain 12 bilingual topics across foundations, practice, and advanced work. Each topic has a goal, a concrete self-check question, and official documentation; each phase has a project milestone. Every topic opens the current three-format practice described above. Lesson generation and code/semantic review use Codex; reading saved lessons, known-alias checks, keyed choices, drafts, and reference answers do not. Saved generated lessons keep their original language; generating a new variation uses the current interface language.

AI-generated exercises can contain mistakes. Check the official source or generate a new variation for disputed behavior. No TypeScript, C#, HTML/CSS, or SQL code is executed by the new practice service. The original React labs provide real browser checks.

Study sessions, topic-v1 reasoning sessions, original React records, drafts, feedback, references viewed, and content versions all remain in SQLite and the JSON export (schema v4). Browser drafts provide an additional copy during navigation or transient failures. Progress shows question types completed, never a mastery percentage for vocabulary recall.

Validation: `pnpm test`, `pnpm build`. Optional `node scripts/verify-study.ts --all` uses real Codex allowance to check seven route samples, synonymous vs opposite English answers, and correct vs broken code, in ignored `data/mixed-smoke`. The earlier `verify-topic-practice.ts` remains for topic-v1 compatibility.
