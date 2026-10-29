# Clarity — Developer Learning Lab

A local-first AI learning platform for React, TypeScript, HTML/CSS, C#/.NET, Node.js, Java, Python, Go, MySQL, SQL Server, and PostgreSQL. A topic is assessed through independent prediction, real React code checks, explanation, transfer, and delayed recall. Watching a lesson or asking the AI to mark a checkbox never awards mastery.

## Current learning experience

All eleven paths (126 topics) now use **multiple choice + coding validation**. There are no keyword blanks or required long written explanations. New React coding tasks use the existing isolated browser runner and authored behavioral checks. Other languages use clearly labeled AI code review, not compiler or database execution.

Choice and code results count independently toward a two-part practice result. Old keyword records remain in SQLite/export but do not count toward completion or assistance. Existing drafts, earlier reviews, and original React labs remain intact. Older saved React tasks without a runner descriptor retain their original AI review behavior; generate a new variation to get browser execution.

### Code editor

Current coding tasks and original React labs use CodeMirror with syntax colors, line numbers, bracket matching, completion, auto indentation, and Tab/Shift+Tab indentation. Use **Format** or **Shift+Alt+F**; automatic formatting on blur is enabled by default and can be disabled in the toolbar. JavaScript/JSX, TypeScript/TSX, HTML/CSS use local Prettier parsers. SQL uses the path-specific MySQL, PostgreSQL, or SQL Server formatter. C# provides syntax colors and indentation cleanup, not a full C# formatter.

**Restore initial code** restores the exercise starter, never the reference solution. Reset and formatting are isolated undo steps; use Undo or Ctrl+Z to restore the previous code. Invalid syntax produces a formatting error and leaves the draft intact. An asynchronous formatter cannot overwrite newer typing, a reset, or a submitted/read-only editor. Formatting is local and does not execute code, send it to AI, or consume Codex allowance.

### Continuous learning and progress

Every topic includes previous/next navigation, a topic picker, and a direct choice-to-code action. Moving to another topic saves the current draft first; navigating does not generate a lesson or award completion.

The catalog, path page, and practice page show overall/current-path progress. Each available topic contributes two checks (choice and code). Distinct successful results accumulate across all variations, including earlier original React prediction/build results. Repeated passes do not add extra credit, and starting a fresh variation cannot erase earlier completion. Historical keyword checks do not contribute. Topic rows show a green completed state, amber in-progress state, or gray not-started state, with distinct icons and text labels. A started topic stays in progress even at 0/2; opening the row shows which question type remains. Progress refreshes after submissions and navigation, without polling or AI calls.

React currently has six focused topics, not comprehensive coverage. The React path has an explicit coverage section listing gaps such as Effects, refs, Context, custom Hooks, performance, Suspense, modern forms, and application integration, with official documentation links. The progress denominator covers available practice, not all React knowledge.

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

Open **Learning paths** for React, TypeScript, HTML/CSS, C#/.NET, Node.js, Java, Python, Go, MySQL, SQL Server, and PostgreSQL. Search topics or filter by frontend, backend, and databases. Paths have stable links such as `/#roadmap/typescript`.

The ten additional paths each contain 12 bilingual topics across foundations, practice, and advanced work. Each topic has a goal, a concrete self-check question, and official documentation; each phase has a project milestone. Every topic opens the current two-format practice described above. Lesson generation and code/semantic review use Codex; reading saved lessons, keyed choices, drafts, and reference answers do not. Saved generated lessons keep their original language; generating a new variation uses the current interface language.

AI-generated exercises can contain mistakes. Check the official source or generate a new variation for disputed behavior. TypeScript, C#, HTML/CSS, and SQL tasks currently use AI code review. New React tasks and original React labs provide real browser checks.

Study sessions, topic-v1 reasoning sessions, original React records, drafts, feedback, references viewed, and content versions all remain in SQLite and the JSON export (schema v4). Browser drafts provide an additional copy during navigation or transient failures. Progress shows question types completed, never a mastery percentage for vocabulary recall.

Validation: `pnpm test`, `pnpm build`. Optional `node scripts/verify-study.ts --all` uses real Codex allowance to check route samples, choice/code generation and correct vs broken SQL code, in ignored `data/choice-code-smoke`. The earlier `verify-topic-practice.ts` remains for topic-v1 compatibility.

Node.js includes 12 topics across runtime/configuration, modules, asynchronous errors, file data, event-loop scheduling, HTTP, events, testing, streams, workers, cancellation, and diagnostics. It uses the shared choice/code flow and JavaScript editor. Node.js code is AI-reviewed, not executed by the app; exercises use stated Node.js 24 assumptions and injected/in-memory boundaries. Existing completion records remain intact; the overall denominator expands to 126 topics / 252 checks.

Java, Python, and Go each include 12 bilingual topics across three stages, with choice and AI-reviewed coding tasks. Baselines: Java 21 (no preview), Python 3.12, Go 1.22; standard libraries only. Syntax highlighting, Tab indentation and undoable reset are available. Java/Go offer editor reindentation only; Python automatic formatting is disabled to preserve semantic whitespace. No learner code is executed on the host. Existing progress is preserved; the larger catalog changes only total counts.
