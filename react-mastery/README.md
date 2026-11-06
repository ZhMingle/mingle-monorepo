# Clarity — Developer Learning Lab

AI requests use two serial lanes: learner actions have a reserved CLI slot, while translation and background preparation share a second slot. Running background work no longer blocks a submitted code review. At most two CLI processes run concurrently. Failed jobs release the queue, each request uses its own schema file, and a timed-out CLI process is stopped before the next job starts. Presentation translation is requested only for the currently selected language, without automatically warming the other language.

源码更新后重新运行 `Start.bat` 或 `Start.ps1`；启动器会在构建缺失或源码比构建更新时自动执行类型检查和构建。新增路线后也请重新运行启动器。启动器会同时检查服务版本与路线目录版本；发现旧服务时，只重启经端口、进程和项目目录核验的本项目服务，保留 `data/` 下的学习记录。页面出现 `Unknown topic.` 或知识点总数仍为旧值时，也可用此方式更新服务后刷新页面。

A local-first AI learning platform for React, TypeScript, HTML/CSS, C#/.NET, Node.js, Java, Python, Go, MySQL, SQL Server, and PostgreSQL. A topic is assessed through independent prediction, real React code checks, explanation, transfer, and delayed recall. Watching a lesson or asking the AI to mark a checkbox never awards mastery.

## Current learning experience

The main navigation contains Learning desk and Learning paths. The retired Understanding lab, Review queue and Evidence journal routes return to the desk; their saved data remains available to the existing storage and export mechanisms. Git choice exercises display starting facts and numbered actions separately, with command text preserved exactly. Complex shell blocks retain the original code display.


All AI requests share the bilingual writing standard in server/writing-style.ts: plain English, natural Chinese, short sentences and concrete actions. It applies to generated questions, assessment feedback, tutoring and translations, including polishing awkward existing target-language prose. Prose uses a direct spoken teaching tone and refers to actual code identifiers instead of inventing translated component names. Translation receives a small list of names extracted from authored starter code; it does not inspect learner drafts or submitted code. Task rules follow the user action order and can use up to eight separate requirements instead of squeezing several rules into one bullet. Existing multi-rule text can use line breaks, which the practice page renders directly. It preserves technical conditions, code, learner quotations and scoring rules. The writing-standard version is part of the translation cache key, so older wording is refreshed when a page is visited instead of translating the entire catalog in advance.


Opening a topic restores its saved session or starts preparing it automatically. Once it is open, the app prepares only the next topic in the background using Codex allowance. Prepared exercises are stored separately from learner sessions, survive restarts, and do not mark a topic started or alter existing drafts. Opening a prepared topic consumes that cache; opening while preparation is running joins the same job. Failed preparation can retry on open. Queued preparation has lower priority than answers, tutor requests and visible translations; an already running background job finishes before the next background job starts, without blocking learner actions. Instant opening depends on preparation having completed.


All eleven paths (126 topics) now use **multiple choice + coding validation**. There are no keyword blanks or required long written explanations. New React coding tasks use the existing isolated browser runner and authored behavioral checks. Other languages use clearly labeled AI code review, not compiler or database execution.

Choice and code results count independently toward a two-part practice result. Old keyword records remain in SQLite/export but do not count toward completion or assistance. Existing drafts, earlier reviews, and original React labs remain intact. Older saved React tasks without a runner descriptor retain their original AI review behavior; generate a new variation to get browser execution.

Practice navigation stays below the workspace toolbar while scrolling. Wide screens show a persistent module directory to the left of the exercise; smaller screens use **Contents** to open it. The directory supports search, stage groups, the current topic and per-topic practice progress. The workspace breadcrumb names and links to the active learning path. Topic changes save the current draft first. Newly generated exercises use short task statements and concise requirements, omitting repeated environment and review boilerplate while keeping conditions needed to determine the answer. Existing saved questions keep their wording.

Practice pages show only the latest check result, explanation and requested reference answer. Earlier submissions are retained for progress and assessment rules but are not listed in the practice interface.

Translation keeps complete sentences together and replaces inline/fenced code with protected tokens while translating. Tokens are checked before restoring the original code, preventing fragmented wording or accidental code changes. Older fragmented translations are bypassed by the new cache version.

### Code editor

Current coding tasks and original React labs use CodeMirror with syntax colors, line numbers, bracket matching, completion, auto indentation, and Tab/Shift+Tab indentation. Use **Format** or **Shift+Alt+F**; automatic formatting on blur is enabled by default and can be disabled in the toolbar. Moving directly to a button or another input skips automatic formatting so layout changes cannot intercept the click; ordinary blur and explicit formatting still work. JavaScript/JSX, TypeScript/TSX, HTML/CSS use local Prettier parsers. SQL uses the path-specific MySQL, PostgreSQL, or SQL Server formatter. C# provides syntax colors and indentation cleanup, not a full C# formatter.

**Restore initial code** restores the exercise starter, never the reference solution. Reset and formatting are isolated undo steps; use Undo or Ctrl+Z to restore the previous code. Invalid syntax produces a formatting error and leaves the draft intact. An asynchronous formatter cannot overwrite newer typing, a reset, or a submitted/read-only editor. Formatting is local and does not execute code, send it to AI, or consume Codex allowance.

### Continuous learning and progress

Every topic includes previous/next navigation, a topic picker, and a direct choice-to-code action. Learners may freely choose any topic or question type; passing exercises is never required to access the next topic. Moving to another topic saves the current draft first; navigating does not generate a lesson or award completion.

The catalog, path page, and practice page show overall/current-path progress. Each available topic contributes two checks (choice and code). Distinct successful results accumulate across all variations, including earlier original React prediction/build results. Repeated passes do not add extra credit, and starting a fresh variation cannot erase earlier completion. Historical keyword checks do not contribute. Topic rows show a green completed state, amber in-progress state, or gray not-started state, with distinct icons and text labels. A started topic stays in progress even at 0/2; opening the row shows which question type remains. Progress refreshes after submissions and navigation, without polling or AI calls.

React currently has six focused topics, not comprehensive coverage. The React path has an explicit coverage section listing gaps such as Effects, refs, Context, custom Hooks, performance, Suspense, modern forms, and application integration, with official documentation links. The progress denominator covers available practice, not all React knowledge.

## Original React labs

- **Understanding Lab** (`/#lab`): an experienced-learner experiment for state snapshots and update queues. Three short probes vary the inputs and operation order. Numbers and repair choices are checked deterministically; Codex evaluates the explanation with a verbatim evidence quote. Correct predictions alone, fluency, and generic recall cannot verify a probe.
- Each probe can be revisited through the three step buttons, edited and checked repeatedly, including after a round is complete. Each check evaluates the current full answer; earlier answers and feedback remain in the evidence trail. Help and evaluated retries remain supported practice and cannot turn a corrected answer into first-attempt independent evidence. This is evidence for one narrow skill, not a general mastery certificate.
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

AI assessments consume the signed-in account's Codex allowance. An unavailable login, exhausted allowance, network failure, or invalid model output produces an explicit error; the draft remains saved and no fabricated grade is substituted. Learner assessments run serially with a timeout; one background job may run alongside them.

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

### 新增学习路径

Shopify、WordPress 与 React Native 各提供基础、实践、进阶三个阶段，共 12 个主题，包含中英文目标、自测问题、阶段项目与官方文档，并沿用现有主题学习与 AI 练习流程。实际运行和发布需在对应平台环境验证。

### 已有题目的语言切换

切换中英文会自动翻译当前已保存练习的题干、选项、讲解、用例说明、已查看的参考说明与反馈，无需重新出题。翻译仅改变显示，不改动代码、选项顺序、用户作答、判分和进度；代码答案保留原文。首次翻译使用 Codex，界面显示等待状态，失败可重试；译文保存在本地数据库，并预热另一种语言以加快再次切换。

### 题目追问

练习页右侧常驻「追问这道题」输入与对话区（窄屏放到题目下方），可结合当前题目逐步讲解、比较选项或要求更简单的例子。对话按题目保存在当前浏览器；离开题目后再次打开可继续。发送使用 Codex，失败保留输入；成功获得讲解会标记对应题型为辅助练习，不授予通过或掌握。启动脚本会检查后端接口版本，并重启已确认的旧版本地服务。

### 扩充路线与云端交付学习

当前共有 16 条路线、378 个知识点：React 为 18 个（含 6 个原有可执行实验室），其他 13 条既有路线各 24 个；新增 Azure 云平台与 CI/CD、AWS CI/CD 各 24 个。既有主题编号保持不变，学习进度按扩充后的真实分母计算。每条既有路线新增 9 个技术主题与 3 个需求验收、质量证据、兼容变更评审主题。

Azure 路线涵盖资源与身份、网络、计算与存储、Key Vault、Azure Pipelines、制品、联合身份、Bicep、槽位、遥测、审批、回滚与恢复。AWS CI/CD 涵盖 IAM、源码连接、CodePipeline、CodeBuild/buildspec、S3、ECR、ECS、CodeDeploy、CloudFormation、CloudWatch、OIDC、跨账户、渐进发布与供应链验证。云主题使用有明确上下文的 YAML/JSON、配置或策略评审，不会从此本地平台执行云部署。课程完成度不授予高级工程师等级；真实项目交付、故障演练和团队评审仍需独立证据。

课程来源：[React](https://react.dev/learn)、[Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/)、[Azure Pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/?view=azure-devops)、[AWS CodePipeline](https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html)、[AWS CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/welcome.html)。各主题还保留对应平台的官方参考入口。

### Next.js 学习路线

新增 Next.js App Router 路线，共 24 个双语主题，分为基础、实践和进阶阶段，涵盖路由布局、服务端与客户端边界、数据获取、流式加载、路由处理器、表单写入、缓存与失效、身份与对象授权、水合、测试、部署、可观测性及升级回滚。每个主题含目标、自测、阶段项目与官方文档。练习使用有明确版本和缓存假设的 TSX/TypeScript 小任务，由 AI 评审，不会在浏览器沙箱执行 Next.js 服务端代码。总目录现为 17 条路线、402 个知识点。参考：https://nextjs.org/docs/app。


### Django 与 Angular 学习路线

新增 Django（后端）与 Angular（前端）路线，各 24 个双语主题，均分为基础、实践和进阶三个阶段，并提供目标、自测、阶段项目与官方资料。Django 涵盖模型、迁移、视图、表单、认证授权、事务、查询优化、测试及部署；Angular 涵盖独立组件、模板、信号、依赖注入、路由、响应式表单、HTTP、RxJS、测试、SSR 与水合。练习明确框架版本和依赖假设，由 AI 评审；不启动框架服务或在 React 沙箱运行。当前目录共 19 条路线、450 个知识点。官方参考：[Django 5.2](https://docs.djangoproject.com/en/5.2/)、[Angular](https://angular.dev/overview)。


### Docker、Kubernetes 与 Git 学习路线

新增工程工具分类及 Docker、Kubernetes、Git 三条路线，各 24 个中英双语主题，均含基础、实践、进阶阶段与阶段项目、学习目标、自测和官方资料。Docker 覆盖镜像、容器、Dockerfile、Compose、网络存储、构建缓存、安全与恢复；Kubernetes 覆盖 Pod、Deployment、Service、配置、探针、资源、RBAC、扩缩容、发布与恢复；Git 覆盖工作区与暂存区、提交、分支、远端协作、冲突、变基、撤销恢复和发布。练习使用具有明确初始状态与版本假设的配置或命令方案，由 AI 评审，不执行容器、集群或 Git 操作。目录现共 22 条路线、522 个知识点、1044 项选择题/编程题完成检查。官方资料：[Docker](https://docs.docker.com/get-started/)、[Kubernetes](https://kubernetes.io/docs/concepts/)、[Git](https://git-scm.com/docs)。


### 代码与翻译边界

说明文字可以翻译，反引号内的标识符、代码围栏内的 SQL/代码以及独立完整 SQL 语句保持原文，不发送给展示翻译。SQL 结构或查询修复选择题应提供完整 SQL 选项，中文仅用于补充说明；选项中的代码按代码样式展示。历史题目和作答记录保留原样，旧题若已生成中文操作描述，可创建新变式使用新的出题规则。


### 讲解排版

讲解、选择题反馈、参考答案和追问回复统一渲染安全的 Markdown 子集：标题、加粗、列表、行内语法和带语法着色的代码块。不解析 HTML、不执行生成内容；历史答案直接按原文渲染。参考答案不再重复拼接已出现在解释中的正确选项，展开参考时避免上下重复整段反馈。新生成讲解用少量加粗突出核心规则，并分段解释机制和常见误区。

### .NET 后端学习顺序

保留 C# 与 .NET 综合路线及原有主题编号；新增 ASP.NET Core、EF Core 独立路线，各 24 个双语主题，包含基础、实践、进阶阶段项目、目标、自测与微软官方资料。建议按 **C# 与 .NET 基础 → ASP.NET Core → EF Core** 学习，同时补充 SQL 与 HTTP。ASP.NET Core 覆盖路由、校验、中间件、依赖注入、认证授权、测试与发布；EF Core 覆盖模型、查询、跟踪、关系、迁移、事务、并发与性能。练习为 AI 评审的 C# 小任务，不启动后端或执行数据库迁移。目录现共 24 条路线、570 个知识点、1140 项完成检查。官方资料：[.NET](https://learn.microsoft.com/en-us/dotnet/)、[ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/)、[EF Core](https://learn.microsoft.com/en-us/ef/core/)。

Reference answers show the complete task code with highlighted changes from the original starter, independent of the learner draft. Unchanged surrounding lines remain visible; the expandable clean final code uses the same complete answer. New generated references must retain the entire starter context. Both sides are formatted consistently when supported. Query-only SQL answers retain a leading CREATE TABLE setup from the task rather than presenting it as a deletion. Character highlights show precise edits; line numbers refer to the formatted comparison. The full reference remains expandable.

Reference answers stay hidden when opening or reloading a practice and when switching question types, including previously assisted sessions. Only clicking View answer reveals the current answer and diff; historical assistance records remain saved independently.

启动器会优先通知已经打开的页面刷新，保留当前路线和知识点；没有连接中的页面时才新建标签。旧版本标签首次需刷新一次以启用通知。
