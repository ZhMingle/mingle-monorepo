# Clarity — Developer Learning Lab

打开或分享 [Clarity](https://clarity-learning-lab-mingle.minglezhang7.chatgpt.site/)，所有人使用同一个原应用入口、侧栏、学习桌、路线组件与样式，没有单独的展示页。访客可直接浏览全部 36 条路线、837 个知识点、阶段目标与官方资料。登录身份只决定能否读取本人的课程、草稿、英语卡片和进度；个人 AI 连接不会提供给未登录访客。`Start.bat` 通过登录入口返回同一个应用。`/#roadmap/git` 等原有路线链接可直接分享。

英语卡片以**常用语块**为主标题，同时保留核心词、`n.` / `v.` / `adj.` 等词性及原有编号、收藏、例句。旧卡片首次打开后分批补齐语块和速记，进度显示在「我的英语积累」旁，连接失败可继续整理。速记包括联想画面、适用时的谐音和词根词缀，词源提供词典查阅入口，不把编造的故事当作词源。

搜索已存卡片时，优先匹配词条和常用语块，再匹配释义、例句和历史输入，自动打开第一个候选。右侧详情与左侧选中项始终对应当前结果；后台生成和朗读不会抢回旧卡。输入焦点保持在搜索框，仍可手动切换其他候选。没有匹配项时清空原详情，清空搜索后显示全部卡片中的第一张。

生成卡片时，输入框和清空按钮仍可使用，方便继续准备下一批。生成按钮在当前批次结束前保持禁用；此时按 Enter 可换行。完成后只清空期间没有编辑过的原输入，保留新草稿，包括重新输入相同文字的情况；重试失败项不会清空输入框。

输入区支持直接 **Ctrl+V 粘贴截图**，也可点「选择图片识字」读取 PNG、JPEG 或 WebP。图片在浏览器本地识别英文和简体中文，不上传图片、不调用付费 OCR 或 AI。先核对可编辑的识别结果，再点「将文字加入输入框」追加到现有草稿；不会自动生成卡片。支持取消、重试和继续打字，单张图片不超过 10 MB、2000 万像素。首次使用需加载同一站点提供的 OCR 引擎及语言模型，语言模型可由浏览器缓存。

「过卡片」入口位于积累区标题旁和全屏卡片工具栏。默认每张读 **3 遍**，可设 1–20 遍；支持手动下一张或读完自动下一张、暂停/继续、上一张、重读和显示释义。只按真实播放结束事件计数；失败时停下来重试，退出后停止朗读。沿用当前筛选和语音设置。

输入自写句子时，先去掉误粘贴的重复词头并纠正语法，再保存整理后的例句及翻译；原输入保留在查询记录，修改说明显示在卡片中。例句会按大小写、空白、引号和句尾标点去重。已知的旧重复词头例句会精确修复，并在私人数据库内保留修改前备份。

英语朗读默认使用免费的 **Kokoro 本机神经语音**，提供美式 Heart 和英式 Emma。单词、例句和试听按钮直接显示准备、播放、完成与失败状态，再点可取消或停止；不再插入会挤动页面的播放器。手机限制自动播放时，点击浮动提示即可继续。新音频需要电脑在线；已生成音频会保存在私人云端缓存，电脑离线仍可重播。不使用付费语音 API，浏览器语音可手动选择备用。安装和边界见 [本机语音说明](local-speech/README.md)。

重复输入已保存的单词或短语时，打开原卡片，并用英文轻松吐槽一句、解释保存的意思；12 种开场随机变化，同一个词不连续重复。英文释义由现有 Codex 连接翻译后缓存，不另开付费 API；首次准备需要电脑在线。批量重复项依次朗读，点击朗读按钮可停止，不新增重复卡片或改动学习进度。

线上版本使用原有 Clarity 站点的 ChatGPT 登录保护、Railway 持久化存储及手机底部导航。已有学习记录通过一次性校验迁移保留，本地数据库另存完整备份。未启用付费 API；线上 AI 通过保持在线的本机 Codex 连接工作。部署边界、数据迁移和运行方式见 [线上运行说明](docs/CLOUD.md)。下文中“本地”说明对应独立的本地运行方式。

### Search Marketing 搜索营销

新增一个「搜索营销」分类，按建议顺序组织六条中英双语路线，共 **123 个主题**，保留所给清单全部十个模块：

1. **Digital Marketing Fundamentals & Metrics**（19）：数字营销基础、搜索意图、漏斗与十二项商业指标。
2. **Google Ads**（15）：广告类型、关键词、出价、文案、转化、预算与 Merchant Center。
3. **SEO, Search Console & Research Tools**（44）：页面、技术与站外 SEO，完整 GSC 流程和七种研究工具。
4. **GA4 & GTM — Measurement and Tracking**（24）：获客、事件、漏斗、电商、归因、数据层、同意模式与服务端标签。
5. **Ecommerce Marketing & CRO**（10）：商品 Feed、Shopping、落地页、实验、再营销、弃购与收入。
6. **AI Search & Marketing Reporting**（11）：GEO／AIO／AEO、AI Overviews、可见性、Looker Studio 与客户报告。

先完成基础，Ads 与 SEO 可并行，再学追踪、电商和报告。每条路线显示共同学习顺序、原模块映射、前置要求、阶段项目和官方／厂商资料；不声称已核实 Webzilla 的招聘硬性要求。现有 Shopify 开发路线保留，电商营销关注获客与商业转化。可从 `/#roadmap/marketing-fundamentals` 开始。

练习为「情境选择＋案例文字回答／计算／方案」，使用真实 Codex 生成与评审；沿用已有回答练习的数据结构，保留旧记录。生成内容必须包含自足的主练习、变化条件的迁移案例、评分标准、参考答案与正确／错误回归示例。选择题按已存答案检查；案例采用 AI 评审，不执行投放、抓取或标签，不要求真实账号或花费。AI 连接失败显示错误，不替代反馈。指标区分收入、利润和增量；新兴 AI 搜索术语不作收录或排名保证。

资料入口采用当前可用的 Skillshop、Search Central、Semrush、Ahrefs 和 Shopify 帮助中心。原 Shopify Academy 地址已跳转，其课程已按官方说明于 2026-10-29 停止，故使用现行帮助中心替代。验证：`pnpm test`、`pnpm build`；可选 `node scripts/verify-study.ts --marketing` 在忽略的独立数据库中检查六条路线的真实出题和正反例评审。

### Redis、Elasticsearch 与 Spring / Spring Boot

三条中英双语路线各有三个阶段、24 个知识点，包含前置要求、阶段项目、学习目标、自检问题和官方资料。目录现为 **36 条路线、837 个知识点、1674 项完成检查**，旧主题编号和学习记录保留。

- Redis：数据结构、过期、缓存失效、流水线、事务、Lua、限流、锁租期、消息流、持久化、集群与恢复边界。
- Elasticsearch：映射、分析器、全文和精确查询、过滤、聚合、分面、嵌套对象、分页、批量失败、并发更新、别名、分片、生命周期和快照。
- Spring / Spring Boot：容器与依赖注入、自动配置、HTTP API、校验、数据访问、事务代理、授权、测试、缓存、异步事件、可观测性和发布。

入口：`/#roadmap/redis`、`/#roadmap/elasticsearch`、`/#roadmap/spring`。每个主题使用现有选择题和代码／配置练习，由真实 Codex 连接生成内容与评审；生成内容必须包含评分标准、主练习和变化条件的迁移案例，以及正确、错误示例。练习采用明确的教学基线：Redis Open Source 7.2、Elasticsearch 8.15、Java 21 + Spring Boot 3.5 / Spring Framework 6.2；这些不是“最新版本”声明。不会运行 Redis 命令、Elasticsearch 请求或 Java 服务，也不会把 AI 推理标为执行结果。参考 [Redis 文档](https://redis.io/docs/latest/)、[Elastic 文档](https://www.elastic.co/docs/)、[Spring Boot 文档](https://docs.spring.io/spring-boot/)。

验证：`pnpm test`、`pnpm build`。可选 `node scripts/verify-study.ts --data-services` 在忽略的独立数据库中使用真实 Codex 连接检查新路线的出题和正确／错误示例评审。

### 性能优化与行为面试路线

新增「前端性能优化」「后端性能优化」「行为面试（Behavioral Questions）」三条中英双语路线，各 24 个主题、三个阶段。目录现为 **36 条路线、837 个知识点、1674 项完成检查**，原有主题编号与学习记录保持不变。

- 前端性能优化：测量基线、LCP/INP/CLS、请求瀑布、图片字体、代码拆分、长任务、布局、React 分析与记忆化、长列表、内存、Worker、缓存、SSR、性能预算和回归验证。
- 后端性能优化：延迟分位数、负载与追踪、CPU/内存、阻塞、算法与响应体、索引和执行计划、N+1、分页、连接池、受控并发、缓存、超时重试、背压、限流、队列、扩容和压测评审。选择题与小型代码/配置任务使用提供的样本或模拟依赖，由 AI 评审；不会执行真实压测，也不把推理结果当作实测加速。
- 行为面试：在「面试与职业发展」分类中，涵盖 STAR、真实故事库、个人贡献、协作冲突、反馈、失误、优先级、模糊需求、用户沟通、影响力、辅导、诚信、失败复盘与模拟面试。每个主题提供情境选择题与带追问的文字回答练习，支持草稿、参考结构、AI 反馈和累计进度。工作、学校、志愿活动和个人项目经历均可；不要求编造数字或成功结果。AI 只评价回答中的证据，不核实经历或预测录用。

路线链接：`/#roadmap/frontend-performance`、`/#roadmap/backend-performance`、`/#roadmap/behavioral-interviews`。参考资料来自 [web.dev](https://web.dev/learn/performance/)、[React](https://react.dev/reference/react/Profiler)、[Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/antipatterns/)、[Amazon 招聘准备](https://amazon.jobs/content/en/faq/interview-prep)及 [Microsoft Careers](https://careers.microsoft.com/v2/global/en/hiring-tips)。课程中的面试题是练习题，不声称是企业原题或统一招聘评分标准。

验证：`pnpm test`、`pnpm build`。可选 `node scripts/verify-study.ts --performance-career` 使用真实 Codex 额度，在忽略的独立数据库中验证三条新路线的出题及正确、错误示例评审，不影响学习记录。

AI requests use two serial lanes: learner actions have a reserved CLI slot, while translation and background preparation share a second slot. Running background work no longer blocks a submitted code review. At most two CLI processes run concurrently. Failed jobs release the queue, each request uses its own schema file, and a timed-out CLI process is stopped before the next job starts. Presentation translation is requested only for the currently selected language, without automatically warming the other language.

源码更新后重新运行 `Start.bat` 或 `Start.ps1`；启动器会在构建缺失或源码比构建更新时自动执行类型检查和构建。新增路线后也请重新运行启动器。启动器会同时检查服务版本与路线目录版本；发现旧服务时，只重启经端口、进程和项目目录核验的本项目服务，保留 `data/` 下的学习记录。页面出现 `Unknown topic.` 或知识点总数仍为旧值时，也可用此方式更新服务后刷新页面。

A local-first AI learning platform for React, TypeScript, HTML/CSS, C#/.NET, Node.js, Java, Python, Go, MySQL, SQL Server, and PostgreSQL. A topic is assessed through independent prediction, real React code checks, explanation, transfer, and delayed recall. Watching a lesson or asking the AI to mark a checkbox never awards mastery.

## Current learning experience

The **Full-screen cards** button on the right of **My English notebook** opens a card wall across the browser viewport, with more columns on larger displays and a single column on phones. Search and category filters stay synchronized with the normal notebook. Cards offer speech and favorites, and open their complete details in a modal. Esc returns from details to the wall, then exits the wall; the exit button restores the notebook selection and scroll position. Reading settings are available inside the wall and use the existing private audio service. Switching views stops pending playback to prevent a late response from speaking after exit.

The English notebook title sits in the workspace top bar. Its main input accepts words, expressions and complete English sentences (up to 300 characters each); desktop input and generation share a row, while phones stack them. Press Enter to generate cards and Shift+Enter to insert a line break. Use one item per line or separate list items with semicolons or spaced slashes. AI infers boundaries in loosely formatted notes and checks that every supplied word is represented. Each learning point normally gets its own card. AI groups synonyms, antonyms, and strongly related alternatives such as “I think”, “I reckon”, “in my opinion”, and “in my view” into a comparison card that explains when to choose each expression. Use “share vs stock” for a pair or “very vs exceptionally vs extreme” for a longer comparison. Adjacent terms can join an explicit comparison when they help explain the same distinction. A following sentence keeps its own card. Ordinary sentences retain their internal punctuation. AI selects one useful card term and translates the original sentence; the app retains that original verbatim among its examples. If the term already exists, the new source example joins that card without replacing previous examples, identity, favorites or numbering. Reopening a saved source sentence reuses the card. New cards include historical origin, root or base, and prefixes or suffixes where applicable. Cards identify imitative origins where known and explain useful connections between concrete and figurative meanings. Historical notes are separate from memory aids. The separate context input is removed; historical context remains readable and exportable.

The main navigation contains Learning desk, Learning paths, and English notebook. The notebook saves English words and phrases with AI explanations, examples, favorites, search, and JSON export. Card headings show continuous notebook ordinals: deleting a card closes the display gap, new cards follow insertion order, and reopening a saved card does not reorder the notebook. Search uses these display numbers; filtering retains each card's notebook number. Stored IDs and archival numbers remain unchanged. The retired Understanding lab, Review queue and Evidence journal routes return to the desk; their saved data remains available to the existing storage and export mechanisms. Git choice exercises display starting facts and numbered actions separately, with command text preserved exactly. Complex shell blocks retain the original code display.

English read-out gives feedback on the original reading button: a spinner while preparing, an animated wave during actual playback, and a brief check after completion. Click the active button again to cancel preparation or stop speech. Audio creates no player, paragraphs or controls in the page layout, so playback does not move the cards. Failures and autoplay blocking use a floating retry notice; a second tap plays the already prepared clip. Kokoro remains the default, and explicitly selected browser speech still waits for its voice inventory and tries other available English voices when needed. No paid speech API is enabled.


All AI requests share the bilingual writing standard in server/writing-style.ts: plain English, natural Chinese, short sentences and concrete actions. It applies to generated questions, assessment feedback, tutoring and translations, including polishing awkward existing target-language prose. Prose uses a direct spoken teaching tone and refers to actual code identifiers instead of inventing translated component names. Translation receives a small list of names extracted from authored starter code; it does not inspect learner drafts or submitted code. Task rules follow the user action order and can use up to eight separate requirements instead of squeezing several rules into one bullet. Existing multi-rule text can use line breaks, which the practice page renders directly. It preserves technical conditions, code, learner quotations and scoring rules. The writing-standard version is part of the translation cache key, so older wording is refreshed when a page is visited instead of translating the entire catalog in advance.


Opening a topic restores its saved session or starts preparing it automatically. Once it is open, the app prepares only the next topic in the background using Codex allowance. Prepared exercises are stored separately from learner sessions, survive restarts, and do not mark a topic started or alter existing drafts. Opening a prepared topic consumes that cache; opening while preparation is running joins the same job. Failed preparation can retry on open. Queued preparation has lower priority than answers, tutor requests and visible translations; an already running background job finishes before the next background job starts, without blocking learner actions. Instant opening depends on preparation having completed.

Prepared study responses carry their cached display text, so the browser can render the selected language immediately without another translation request. Freshly generated prose already in the requested language uses the current writing standard directly. Cached Chinese can open while English preparation is still running; feedback only prepares new text instead of invalidating the whole lesson. The practice page shows whether the next topic is preparing, ready or needs a retry. Read-only question headings use an arrow pointer while answer inputs and code editing keep their normal cursors.

Exercise text and submission feedback have separate display readiness. Preparing or retrying feedback and revealed-answer translations leaves the prepared question, code editor and learner draft on screen. Validated new AI reviews already written in the requested language are cached directly, preserving learner quotations and earlier polished lesson text. Historical or mixed-language feedback can still translate, with its own loading and retry notice beside the result.


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

选择题的标准答案和讲解随题目一起准备，显示语言也提前缓存；选择选项或查看答案时直接使用已存内容，不再临时调用 AI 翻译。提前准备不会标记辅助或完成练习；点击「查看答案」才记录辅助。其他题型的历史评审翻译不会阻塞当前选择题。

进入已有知识点时优先读取保存的题目，不等待 AI 润色或历史反馈翻译；所选语言尚未就绪时先显示原题和已存讲解。读取超过 45 秒会显示可重试的错误，重试仍读取原有练习，保留学习记录。

讲解从具体例子要做的事说起，再逐步解释代码为什么这样写；术语随用随解释，不把多个概念压成一句话。已有讲解也会通过带版本缓存的呈现层重新润色，保留代码、技术条件和学习记录。

讲解与示例都面向没有技术基础的读者：先说具体问题，再解释每一步；能用日常说法就不用术语，必要术语先说明意思。新示例一次只教一个主要知识点，已有复杂示例保留代码并逐步解释。正文限制阅读宽度，按意思分段。

讲解与示例顶部显示 1–5 星的重要性、重要原因及两个实际用途。星级表示知识点在所属技术中的日常用途和基础作用，不代表难度或掌握程度。盒模型、Flex、Grid 和常用 SQL 基础使用固定评定；其他知识点由 AI 首次评定后按知识点与语言缓存，已有课程无需重新生成。

### .NET 后端学习顺序

保留 C# 与 .NET 综合路线及原有主题编号；新增 ASP.NET Core、EF Core 独立路线，各 24 个双语主题，包含基础、实践、进阶阶段项目、目标、自测与微软官方资料。建议按 **C# 与 .NET 基础 → ASP.NET Core → EF Core** 学习，同时补充 SQL 与 HTTP。ASP.NET Core 覆盖路由、校验、中间件、依赖注入、认证授权、测试与发布；EF Core 覆盖模型、查询、跟踪、关系、迁移、事务、并发与性能。练习为 AI 评审的 C# 小任务，不启动后端或执行数据库迁移。目录现共 24 条路线、570 个知识点、1140 项完成检查。官方资料：[.NET](https://learn.microsoft.com/en-us/dotnet/)、[ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/)、[EF Core](https://learn.microsoft.com/en-us/ef/core/)。

Reference answers show the complete task code with highlighted changes from the original starter, independent of the learner draft. Unchanged surrounding lines remain visible; the expandable clean final code uses the same complete answer. New generated references must retain the entire starter context. Both sides are formatted consistently when supported. Query-only SQL answers retain a leading CREATE TABLE setup from the task rather than presenting it as a deletion. Character highlights show precise edits; line numbers refer to the formatted comparison. The full reference remains expandable.

Reference answers stay hidden when opening or reloading a practice and when switching question types, including previously assisted sessions. Only clicking View answer reveals the current answer and diff; historical assistance records remain saved independently.

启动器会优先通知已经打开的页面刷新，保留当前路线和知识点；没有连接中的页面时才新建标签。旧版本标签首次需刷新一次以启用通知。

练习请求优先读取已保存的界面语言，避免首次加载时误用英文。题目文字准备完成后再显示；翻译失败会提供重试，不显示其他语言的原题。中文题目保留技术关键字和代码，Shopify 的 section、snippet、badge、markup、render、assign 等不会被翻译；已有题目的中文展示也会按新版规则重新处理，保留学习记录和草稿。
