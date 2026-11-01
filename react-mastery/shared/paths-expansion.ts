import { pathStage } from './path-types.ts';
import type { LearningPath,PathId,TopicSpec } from './path-types.ts';

// Three technology-specific topics per stage, plus one applied engineering topic.
const additions:Partial<Record<PathId,TopicSpec[]>>={
  react:[
    ['events','Events & propagation','事件与传播','Separate passing handlers from invoking them and control propagation.','区分传递与调用事件处理器，并控制事件传播。','Why can onClick={save()} trigger work during render?','为什么 onClick={save()} 会在渲染时执行操作？'],
    ['controlled-input','Controlled forms','受控表单','Keep input values and validation consistent with state.','让输入值、校验与状态保持一致。','Why does an input become uneditable when value has no updating handler?','为什么只有 value 而没有更新处理器时输入框无法编辑？'],
    ['state-ownership','State ownership & composition','状态归属与组件组合','Lift shared state to the nearest common owner.','将共享状态提升到最近的共同所有者。','Where should selection live when two sibling panels must agree?','两个兄弟面板必须同步选择时，状态应该放在哪里？'],
    ['effect-lifecycle','Effect setup & cleanup','副作用建立与清理','Synchronize external systems and undo subscriptions.','同步外部系统，并正确撤销订阅。','Why must a subscription effect return cleanup when its input changes?','订阅依赖变化时，为什么需要清理旧订阅？','https://react.dev/learn/synchronizing-with-effects'],
    ['request-races','Request races & stale closures','请求竞态与过期闭包','Prevent old requests and captured values from overwriting current state.','防止旧请求与捕获的旧值覆盖当前状态。','How can a slower search for A overwrite a newer search for B?','较慢的 A 搜索如何覆盖后发的 B 搜索？'],
    ['refs-context','Refs, context & custom hooks','引用、上下文与自定义 Hook','Separate mutable handles, shared values, and reusable stateful logic.','区分可变句柄、共享值与可复用状态逻辑。','Why does writing ref.current not update visible text automatically?','为什么修改 ref.current 不会自动更新可见文字？'],
    ['render-performance','Render profiling & memoization','渲染分析与记忆化','Measure expensive work before adding memoization.','先测量高成本操作，再选择记忆化。','Why can recreating an object prop defeat a memoized child?','为什么每次重建对象属性可能使子组件的记忆化失效？'],
    ['suspense-errors','Suspense & error boundaries','Suspense 与错误边界','Separate supported loading boundaries from rendering failures.','区分受支持的加载边界与渲染失败。','Does wrapping an ordinary effect fetch in Suspense automatically show its fallback?','用 Suspense 包裹普通 effect 请求，会自动显示加载占位吗？'],
    ['external-store','External stores & consistency','外部状态与一致性','Subscribe to external state through a consistent snapshot contract.','通过一致的快照约束订阅外部状态。','Why is reading a mutable global during render not a subscription?','为什么渲染时读取可变全局变量不等于订阅？','https://react.dev/reference/react/useSyncExternalStore']
  ],
  typescript:[
    ['nullability','Nullability & optional values','空值与可选值','Handle missing values without non-null assertions.','无需非空断言即可处理缺失值。','How does an optional property differ from a required property accepting undefined?','可选属性与允许 undefined 的必填属性有何区别？'],
    ['literal-contracts','Literal types & satisfies','字面量类型与 satisfies','Validate configurations while retaining useful inferred types.','校验配置，同时保留有用的推断类型。','How can satisfies check a map without replacing its inferred shape?','satisfies 如何检查映射而不替换推断结构？'],
    ['structural-types','Structural compatibility','结构兼容性','Reason about assignability and excess-property checking.','理解可赋值性与多余属性检查。','Why can a variable assignment accept extra fields that an object literal rejects?','为什么变量赋值可能接受对象字面量被拒绝的额外字段？'],
    ['async-contracts','Typed asynchronous contracts','异步类型约束','Model Promise results and explicitly handle unknown failures.','建模 Promise 结果，并明确处理未知错误。','Does Promise<User> guarantee rejection contains an Error?','Promise<User> 能保证拒绝值一定是 Error 吗？'],
    ['type-guards','Sound type predicates','可靠的类型谓词','Implement runtime checks that justify a narrowing claim.','实现足以支持类型收窄的运行时检查。','What goes wrong if isUser only checks that a value is an object?','isUser 只检查对象类型会出现什么问题？'],
    ['typed-components','Typed components & events','组件与事件类型','Preserve prop relationships and event payload types.','保留属性间关系与事件载荷类型。','How can a union prevent an href-only property on a button variant?','如何用联合类型禁止按钮变体接收专属于链接的 href？'],
    ['declarations','Declaration files & library contracts','声明文件与库约束','Describe external modules without concealing runtime behavior.','描述外部模块，不掩盖运行时行为。','Can a declaration make a missing runtime export exist?','声明文件能让不存在的运行时导出出现吗？'],
    ['variance','Variance & callback safety','型变与回调安全','Check function parameter compatibility at API boundaries.','在 API 边界检查函数参数兼容性。','Why is a dog-only callback unsafe where any animal may be passed?','允许传入任意动物的位置，为什么不能接收仅处理狗的回调？'],
    ['type-regressions','Type regression checks','类型回归检查','Protect public contracts with compile-time positive and negative examples.','通过正反编译示例保护公共约束。','How can @ts-expect-error expose a restriction that accidentally disappeared?','@ts-expect-error 如何发现意外消失的类型限制？']
  ],
  'html-css':[
    ['document-navigation','Document structure & navigation','文档结构与导航','Build meaningful headings, landmarks, and link destinations.','建立合理标题、地标与链接目标。','Why should heading levels reflect document hierarchy rather than font size?','为什么标题层级应表达文档结构，而非字号？'],
    ['media','Responsive images & media','响应式图片与媒体','Choose image sizes and reserve layout space.','选择图片尺寸，并预留布局空间。','How do width and height attributes help prevent layout shifts?','width 和 height 属性如何减少布局偏移？'],
    ['focus-states','Focus & interaction states','焦点与交互状态','Design visible keyboard focus and consistent disabled states.','设计可见的键盘焦点与一致的禁用状态。','Why is removing outlines without a replacement harmful?','为什么移除轮廓却不提供替代焦点样式会有问题？'],
    ['container-queries','Container queries','容器查询','Adapt components to their available container space.','根据组件容器的可用空间调整布局。','Why can a viewport breakpoint fail for a card inside a narrow sidebar?','视口断点为什么可能不适合窄侧栏中的卡片？'],
    ['overflow','Overflow & content resilience','溢出与内容适应性','Handle long words, zoom, and variable-height content.','处理长单词、缩放与不固定高度的内容。','How should an action row behave when labels double in length?','操作按钮文字长度翻倍后，布局应该如何适应？'],
    ['dialogs','Dialogs & native semantics','对话框与原生语义','Manage modal focus, dismissal, and accessible names.','管理模态焦点、关闭行为与可访问名称。','Where should keyboard focus go when a modal opens and closes?','模态框打开和关闭时，键盘焦点应如何移动？'],
    ['progressive-enhancement','Progressive enhancement','渐进增强','Keep essential content usable when optional features fail.','可选功能失败时，仍让核心内容可用。','What should remain usable if a decorative animation cannot load?','装饰动画无法加载时，哪些功能仍应可用？'],
    ['reduced-motion','Motion & user preferences','动画与用户偏好','Respect reduced-motion and color-scheme preferences.','尊重减少动画与配色偏好。','How can motion be reduced without hiding completion feedback?','如何减少动画，同时保留完成反馈？'],
    ['cross-browser','Cross-browser debugging','跨浏览器调试','Diagnose feature support with targeted fallbacks.','通过针对性回退处理特性支持差异。','How can @supports isolate an enhancement from a baseline layout?','@supports 如何将增强效果与基础布局隔离？']
  ],
  dotnet:[
    ['nullable-reference','Nullable reference types','可空引用类型','Distinguish compiler annotations from runtime validation.','区分编译器标注与运行时校验。','Can a non-nullable DTO property still receive invalid external input?','非空 DTO 属性仍可能接收到非法外部输入吗？'],
    ['linq-execution','LINQ deferred execution','LINQ 延迟执行','Recognize query enumeration and materialization boundaries.','识别查询枚举与物化边界。','Why can enumerating a query twice repeat database work?','为什么两次枚举查询可能重复访问数据库？'],
    ['disposal','Disposal & resource ownership','资源释放与所有权','Release owned resources with using and async disposal.','用 using 与异步释放管理自有资源。','Who should dispose a dependency created by the DI container?','由 DI 容器创建的依赖应该由谁释放？'],
    ['middleware','Middleware & request pipeline','中间件与请求管线','Order middleware around authentication and error handling.','围绕身份认证和错误处理安排中间件顺序。','Why can middleware order change whether an error is caught?','中间件顺序为什么影响错误能否被捕获？'],
    ['ef-tracking','EF Core tracking & queries','EF Core 跟踪与查询','Avoid accidental N+1 reads and unnecessary tracking.','避免意外 N+1 查询与不必要的跟踪。','When can a projected read benefit from AsNoTracking?','投影读取何时可以受益于 AsNoTracking？'],
    ['cancellation','Cancellation propagation','取消信号传递','Propagate cancellation across requests and data access.','跨请求与数据访问传递取消信号。','Why is accepting CancellationToken insufficient if it is never passed onward?','接收 CancellationToken 却不继续传递，为什么不起作用？'],
    ['concurrency-tokens','Optimistic concurrency','乐观并发控制','Detect conflicting updates instead of silently overwriting.','检测更新冲突，避免静默覆盖。','How should an API respond when its row version is stale?','行版本已过期时，API 应如何响应？'],
    ['background-services','Background service lifecycle','后台服务生命周期','Bound retries and scope dependencies in background workers.','限制重试，并管理后台工作器中的依赖作用域。','Why should a singleton worker not capture a scoped DbContext?','为什么单例工作器不应长期持有作用域 DbContext？'],
    ['trace-correlation','Structured logs & tracing','结构化日志与链路追踪','Correlate requests without logging secrets.','关联请求，并避免记录敏感信息。','How do you connect an HTTP failure to the downstream database span?','如何关联 HTTP 失败与下游数据库追踪片段？']
  ],
  nodejs:[
    ['blocking-work','Event loop & blocking work','事件循环与阻塞任务','Distinguish asynchronous I/O from CPU-bound JavaScript.','区分异步 I/O 与 CPU 密集型 JavaScript。','Why does putting a large loop in an async function still block requests?','为什么把大循环放进 async 函数仍会阻塞请求？'],
    ['url-input','URL parsing & input limits','URL 解析与输入限制','Validate request paths, payload sizes, and encodings.','校验请求路径、载荷大小与编码。','Why should a server reject oversized bodies before parsing JSON?','为什么服务应在解析 JSON 前拒绝超大请求体？'],
    ['package-boundaries','Package exports & dependency scope','包导出与依赖范围','Expose deliberate module entry points and pin reproducible installs.','明确模块入口，并固定可复现安装。','Why can importing an internal file break after a dependency update?','为什么导入包内部文件可能在依赖更新后失效？'],
    ['http-timeouts','HTTP timeouts & connection reuse','HTTP 超时与连接复用','Bound outbound requests and distinguish connection failures.','限制出站请求时间，并区分连接失败。','Why can an unbounded downstream request exhaust a service?','为什么无超时的下游请求可能耗尽服务资源？'],
    ['worker-threads','Worker threads & CPU tasks','工作线程与 CPU 任务','Move suitable CPU work off the event loop.','将适合的 CPU 工作移出事件循环。','When can worker startup and transfer cost exceed its benefit?','工作线程启动和数据传输成本何时可能超过收益？'],
    ['test-isolation','Node test isolation & injected I/O','Node 测试隔离与 I/O 注入','Test behavior through explicit clocks and I/O dependencies.','通过明确时钟和 I/O 依赖测试行为。','How can an injected clock remove a flaky timeout test?','注入时钟如何消除不稳定的超时测试？'],
    ['graceful-shutdown','Graceful shutdown','优雅停机','Stop accepting work and drain bounded in-flight tasks.','停止接收新任务，并在限定时间内完成进行中的工作。','What happens if a process exits before pending writes finish?','待完成写入结束前退出进程会怎样？'],
    ['memory-diagnosis','Memory leaks & heap diagnosis','内存泄漏与堆分析','Locate retained objects with measurements instead of guesses.','通过测量定位被保留对象，而非猜测。','How can an unbounded Map retain every completed request?','无限增长的 Map 如何保留所有已完成请求？'],
    ['service-resilience','Retry budgets & circuit breaking','重试预算与熔断','Bound transient retries and prevent cascading overload.','限制瞬时故障重试，防止级联过载。','Why can retrying every failure immediately worsen an outage?','为什么立刻重试所有失败可能加重故障？']
  ],
  java:[
    ['equality','Equality & hash contracts','相等与哈希约束','Keep equals and hashCode consistent for collection keys.','保证集合键的 equals 与 hashCode 一致。','Why can mutating a key make a HashMap lookup fail?','修改键为什么可能让 HashMap 查询失败？'],
    ['resource-safety','Try-with-resources','资源自动关闭','Close owned resources even when exceptions occur.','发生异常时也正确关闭自有资源。','What happens to an open stream when the body throws?','代码主体抛出异常时，打开的流如何关闭？'],
    ['generic-variance','Generic bounds & wildcards','泛型边界与通配符','Use producer and consumer bounds deliberately.','合理使用生产者与消费者边界。','Why can List<? extends Number> not safely accept an Integer append?','为什么 List<? extends Number> 不能安全追加 Integer？'],
    ['stream-laziness','Stream laziness & side effects','流的惰性与副作用','Distinguish pipeline construction from terminal evaluation.','区分流水线建立与终止求值。','Why may a stream map function not execute without a terminal operation?','为什么没有终止操作时 map 函数可能不执行？'],
    ['jdbc-transactions','JDBC transaction boundaries','JDBC 事务边界','Commit related changes atomically and roll back failures.','原子提交相关变更，并回滚失败。','How can auto-commit split a two-step transfer into partial success?','自动提交如何让两步转账出现部分成功？'],
    ['concurrency-safety','Visibility & concurrent state','可见性与并发状态','Separate visibility from atomic compound operations.','区分可见性与复合操作的原子性。','Does volatile make count++ atomic?','volatile 能让 count++ 变为原子操作吗？'],
    ['virtual-threads','Virtual threads & workload limits','虚拟线程与工作负载限制','Bound downstream resources even with cheap threads.','即使线程成本较低，也要限制下游资源用量。','Why can virtual threads still exhaust a database connection pool?','虚拟线程为什么仍可能耗尽数据库连接池？'],
    ['jvm-profiling','JVM profiling & garbage collection','JVM 分析与垃圾回收','Measure allocation and pauses before tuning GC.','调整 GC 前先测量分配与停顿。','What evidence distinguishes allocation pressure from retained-object growth?','什么证据能区分分配压力与保留对象增长？'],
    ['api-evolution','API evolution & compatibility','API 演进与兼容性','Evolve public contracts while protecting existing callers.','演进公共约束，同时保护已有调用方。','Why can changing a return type break an already compiled client?','修改返回类型为什么可能破坏已编译客户端？']
  ],
  python:[
    ['mutability-defaults','Mutable defaults & aliasing','可变默认值与别名','Recognize shared object references across calls.','识别调用之间共享的对象引用。','Why can a default list retain items from previous calls?','默认列表为什么可能保留之前调用的元素？'],
    ['iterators','Iterators & generators','迭代器与生成器','Consume lazy sequences without assuming repeatability.','消费惰性序列，不假定可以重复遍历。','What does a second pass over an exhausted generator produce?','再次遍历已经耗尽的生成器会得到什么？'],
    ['context-managers','Context managers','上下文管理器','Use with to make resource cleanup explicit.','使用 with 明确资源清理。','How does with help when reading a file raises an exception?','读取文件时抛出异常，with 如何帮助清理？'],
    ['typing-validation','Type hints & runtime validation','类型提示与运行时校验','Keep annotations separate from checking untrusted data.','区分类型标注与不可信数据校验。','Does annotating a parameter as int reject a runtime string?','参数标注为 int 会自动拒绝运行时字符串吗？'],
    ['asyncio-cancellation','Asyncio cancellation','Asyncio 取消处理','Await tasks and release resources during cancellation.','等待任务，并在取消时释放资源。','Why can blocking time.sleep inside a coroutine delay unrelated tasks?','为什么协程中的阻塞 time.sleep 会拖慢无关任务？'],
    ['packaging','Packaging & reproducible environments','打包与可复现环境','Separate application imports from accidental working-directory behavior.','区分应用导入与偶然的工作目录行为。','Why can a module import work locally but fail after package installation?','为什么模块导入本地可用，安装为包后却失败？'],
    ['process-parallelism','Processes & parallel workloads','进程与并行任务','Choose execution models using workload measurements.','根据工作负载测量选择执行模型。','Why can serializing a large object erase a process pool speedup?','序列化大对象为什么可能抵消进程池的提速？'],
    ['profiling','Profiling & memory retention','性能分析与内存保留','Measure hot paths and retained data before optimizing.','优化前测量热点与保留数据。','How can reading a generator into a list change peak memory use?','将生成器读入列表如何影响峰值内存？'],
    ['robust-io','Timeouts & retry-safe I/O','超时与可安全重试的 I/O','Bound I/O retries and distinguish retry-safe operations.','限制 I/O 重试，并区分可安全重试的操作。','Why is retrying a payment request different from retrying a read?','为什么重试付款请求与重试读取不同？']
  ],
  go:[
    ['slice-aliasing','Slices & backing arrays','切片与底层数组','Reason about shared storage and append behavior.','理解共享存储与 append 行为。','When can modifying a subslice change the original slice?','修改子切片何时会改变原切片？'],
    ['interfaces-nil','Interfaces & typed nil','接口与带类型的 nil','Distinguish nil interfaces from nil concrete pointers.','区分 nil 接口与为 nil 的具体指针。','Why can an error interface containing a nil pointer be non-nil?','为什么包含 nil 指针的 error 接口可能不等于 nil？'],
    ['defer-errors','Defer & error wrapping','延迟清理与错误包装','Clean up owned resources and preserve error identity.','清理自有资源，并保留错误身份。','How does wrapping with %w support errors.Is?','使用 %w 包装如何支持 errors.Is？'],
    ['context-propagation','Context propagation','Context 传递','Pass deadlines and cancellation through service boundaries.','跨服务边界传递截止时间与取消信号。','Why must a worker observe ctx.Done rather than just receive a context?','工作器为什么必须监听 ctx.Done，而不只是接收 context？'],
    ['goroutine-lifecycle','Goroutine ownership','Goroutine 生命周期归属','Give spawned work an owner and termination path.','为启动的并发任务指定所有者与退出路径。','How can sending on an unread channel leak a goroutine?','向无人接收的通道发送如何造成 goroutine 泄漏？'],
    ['race-detection','Races & synchronization','数据竞争与同步','Protect shared data and use race detection as evidence.','保护共享数据，并用竞争检测提供证据。','Why does concurrent map access need coordination?','为什么并发访问 map 需要协调？'],
    ['bounded-concurrency','Bounded concurrency','有界并发','Limit worker count and downstream resource use.','限制工作器数量与下游资源用量。','Why can spawning one goroutine per item overload a database?','为什么为每个元素启动一个 goroutine 可能压垮数据库？'],
    ['http-lifecycle','HTTP service lifecycle','HTTP 服务生命周期','Set timeouts and drain requests during shutdown.','设置超时，并在停机时处理进行中的请求。','What differs between closing a server immediately and graceful shutdown?','立即关闭服务与优雅停机有什么区别？'],
    ['benchmarks','Benchmarks & allocation profiling','基准测试与分配分析','Use representative benchmarks and allocation measurements.','使用有代表性的基准测试与分配测量。','Why can a benchmark of unused work give misleading results?','为什么基准测试中未使用的计算可能产生误导？']
  ],
  mysql:[
    ['null-logic','NULL & three-valued logic','NULL 与三值逻辑','Handle unknown comparisons explicitly.','明确处理未知比较结果。','Why does value = NULL not select missing values?','为什么 value = NULL 不能选出空值？'],
    ['joins-cardinality','Join cardinality','连接基数','Predict how joins multiply rows before aggregating.','聚合前预测连接如何增加行数。','Why can joining two one-to-many tables inflate SUM?','连接两个一对多表为什么可能放大 SUM？'],
    ['charset-collation','Character sets & collations','字符集与排序规则','Choose encoding and comparison rules deliberately.','明确选择编码与比较规则。','How can a case-insensitive collation change unique-key behavior?','不区分大小写的排序规则如何改变唯一键行为？'],
    ['isolation-anomalies','Isolation & read anomalies','隔离级别与读取异常','Explain snapshots and locking reads in InnoDB.','解释 InnoDB 中的快照与锁定读取。','Why can two sessions both see stock before conflicting updates?','为什么两个会话都可能先看到库存，再发生更新冲突？'],
    ['deadlocks','Deadlocks & retry boundaries','死锁与重试边界','Order locks and retry complete transactions when appropriate.','统一加锁顺序，并在适当时重试完整事务。','Why should a deadlock retry repeat the entire logical transaction?','死锁后为什么应重试整个逻辑事务？'],
    ['query-plans','EXPLAIN & query plans','EXPLAIN 与查询计划','Use plan evidence and real cardinality to improve queries.','通过计划证据与实际基数改进查询。','Why can an index exist but not be selected by the optimizer?','为什么索引存在，却不被优化器选择？'],
    ['schema-migration','Compatible schema migrations','兼容的结构迁移','Expand and contract schemas across mixed application versions.','在新旧应用并存时采用扩展再收缩的迁移。','Why is dropping a column before old workers stop unsafe?','旧工作器停止前删除列为什么不安全？'],
    ['replication-lag','Replication & stale reads','复制与延迟读取','Account for replica lag in read-after-write workflows.','在写后读流程中考虑副本延迟。','Why can a successful write appear missing on a replica?','写入成功后，为什么副本上可能暂时查不到？'],
    ['restore-drills','Backup restoration & recovery','备份恢复与故障恢复','Validate restore procedures and recovery objectives.','验证恢复流程与恢复目标。','Why is a completed backup job not proof of a recoverable database?','为什么备份任务完成不等于数据库可恢复？']
  ],
  sqlserver:[
    ['null-logic','NULL & predicate logic','NULL 与谓词逻辑','Use explicit null checks and reason about unknown predicates.','显式检查空值，并理解未知谓词。','Why can NOT IN return no rows when its subquery contains NULL?','子查询包含 NULL 时，NOT IN 为什么可能返回零行？'],
    ['join-multiplicity','Joins & aggregation','连接与聚合','Control row multiplication before grouping.','分组前控制连接带来的行数增加。','Why can a customer total double after joining line items and payments?','连接明细和付款后，客户总额为什么可能翻倍？'],
    ['data-types','Data types & implicit conversions','数据类型与隐式转换','Match parameter types to storage and comparison semantics.','让参数类型匹配存储与比较语义。','How can an implicit conversion prevent an efficient index seek?','隐式转换如何阻碍高效的索引查找？'],
    ['isolation-versioning','Isolation & row versioning','隔离与行版本','Compare lock-based reads with versioned reads.','比较基于锁与版本的读取。','Does snapshot isolation remove all write conflicts?','快照隔离能消除所有写冲突吗？'],
    ['execution-plans','Execution plans & estimates','执行计划与估算','Compare estimated and actual rows to diagnose plans.','比较估算与实际行数，诊断执行计划。','What can a large estimate error imply about statistics or skew?','估算误差很大可能说明统计信息或数据倾斜有什么问题？'],
    ['parameter-sensitivity','Parameter-sensitive workloads','参数敏感的工作负载','Recognize skew-dependent plan performance.','识别随数据倾斜变化的计划性能。','Why can the same query be fast for one customer and slow for another?','同一个查询为什么对不同客户有不同耗时？'],
    ['migration-locking','Migrations & blocking','迁移与阻塞','Plan schema changes around lock impact and compatibility.','围绕锁影响与兼容性规划结构变更。','Why can a schema change block ordinary requests?','结构变更为什么可能阻塞普通请求？'],
    ['recovery-chain','Recovery models & log chains','恢复模式与日志链','Match backup strategy to recovery requirements.','让备份策略匹配恢复要求。','Why does point-in-time recovery require an intact log backup chain?','为什么时间点恢复需要完整日志备份链？'],
    ['query-observability','Query Store & regressions','Query Store 与性能回归','Investigate plan changes with historical workload evidence.','通过历史工作负载证据分析计划变化。','What evidence distinguishes a changed plan from increased request volume?','什么证据能区分计划改变与请求量增加？']
  ],
  postgresql:[
    ['null-logic','NULL & distinctness','NULL 与差异比较','Compare nullable values with deliberate semantics.','按明确语义比较可空值。','When does IS DISTINCT FROM differ from <>?','IS DISTINCT FROM 何时与 <> 不同？'],
    ['join-aggregates','Joins & aggregate correctness','连接与聚合正确性','Check row multiplicity before computing totals.','计算总额前检查行的重复倍数。','Why can joining independent detail tables overcount totals?','连接独立明细表为什么可能重复计算总额？'],
    ['referential-actions','Constraints & referential actions','约束与引用操作','Choose constraints and delete behavior to protect invariants.','选择约束与删除行为来保护不变量。','When is ON DELETE CASCADE inappropriate for historical records?','历史记录什么时候不适合 ON DELETE CASCADE？'],
    ['isolation-conflicts','Isolation & serialization failures','隔离与序列化失败','Handle transaction conflicts at the correct retry boundary.','在正确边界处理事务冲突与重试。','Why must a serialization failure retry the whole transaction?','序列化失败后为什么必须重试整个事务？'],
    ['explain-analyze','EXPLAIN ANALYZE & buffers','EXPLAIN ANALYZE 与缓冲区','Inspect runtime row counts and I/O evidence.','检查运行时行数与 I/O 证据。','Why should you remember that EXPLAIN ANALYZE actually executes the query?','为什么必须记住 EXPLAIN ANALYZE 会真实执行查询？'],
    ['locking','Row locks & deadlocks','行锁与死锁','Coordinate competing updates with consistent lock ordering.','通过一致加锁顺序协调竞争更新。','How can two transfers deadlock when they lock accounts in opposite order?','两次转账按相反顺序锁账户，如何导致死锁？'],
    ['online-migration','Online migrations','在线迁移','Plan index and constraint changes under active traffic.','在有流量时规划索引与约束变更。','Why can creating an index concurrently require special migration handling?','并发创建索引为什么需要特别处理迁移流程？'],
    ['replica-consistency','Replica consistency & lag','副本一致性与延迟','Route consistency-sensitive reads appropriately.','合理路由对一致性敏感的读取。','Where should a user read immediately after changing their profile?','用户修改资料后立即读取，应该访问哪里？'],
    ['pitr','WAL & point-in-time recovery','WAL 与时间点恢复','Verify base backups and WAL availability in restore drills.','在恢复演练中验证基础备份与 WAL 可用性。','Why is a base backup alone insufficient for an arbitrary later recovery point?','为什么只有基础备份不足以恢复到任意后续时间点？']
  ],
  shopify:[
    ['theme-workflow','Development themes & version control','开发主题与版本控制','Separate development previews from published theme changes.','区分开发预览与已发布主题变更。','Why should a local experiment not overwrite a live theme directly?','为什么本地实验不应直接覆盖线上主题？'],
    ['liquid-scope','Liquid scope & reusable snippets','Liquid 作用域与可复用片段','Pass explicit inputs into reusable rendering fragments.','向可复用渲染片段传递明确输入。','Why should a snippet not depend on an unrelated template variable?','为什么片段不应依赖无关模板中的变量？'],
    ['variant-selection','Variant selection & pricing','变体选择与价格','Keep displayed price and selected variant aligned.','让显示价格与选中的变体保持一致。','What breaks if option selection updates a label but not the submitted variant id?','选项改变只更新标签，不更新提交的变体 id，会怎样？'],
    ['section-lifecycle','Theme editor section lifecycle','主题编辑器区块生命周期','Initialize and remove section behavior without duplicate listeners.','初始化和移除区块行为，避免重复监听。','Why can reloading a section in the editor attach the same handler twice?','编辑器重新加载区块为什么可能重复绑定处理器？'],
    ['cart-concurrency','Concurrent cart updates','并发购物车更新','Coordinate asynchronous mutations and authoritative cart totals.','协调异步变更与服务端权威购物车总额。','How can two fast quantity changes display an outdated cart total?','快速连续修改数量如何显示过期总额？'],
    ['search-filtering','Search & collection filtering','搜索与集合筛选','Keep filters, URLs, pagination, and empty states consistent.','让筛选、URL、分页和空状态保持一致。','Why should changing a filter reset an invalid page number?','改变筛选时为什么应重置失效页码？'],
    ['webhook-idempotency','Webhooks & duplicate delivery','Webhook 与重复投递','Design app-side processing to tolerate duplicate notifications.','让应用端处理容忍重复通知。','Why must repeated order notifications not create duplicate fulfillment work?','重复订单通知为什么不能重复创建履约任务？','https://shopify.dev/docs/apps/build/webhooks'],
    ['api-versioning','API versions & upgrades','API 版本与升级','Pin API assumptions and test contract changes.','固定 API 假设，并测试约束变化。','What should a client test before changing its API version?','客户端更换 API 版本前应测试什么？','https://shopify.dev/docs/api/usage/versioning'],
    ['extension-boundaries','App extensions & platform boundaries','应用扩展与平台边界','Choose supported extension points instead of editing protected surfaces.','选择受支持扩展点，避免修改受保护界面。','Why should checkout customization first verify its supported extension surface?','定制结账前为什么应先确认支持的扩展范围？','https://shopify.dev/docs/apps/build']
  ],
  wordpress:[
    ['php-boundaries','PHP input & output boundaries','PHP 输入与输出边界','Separate validation, sanitization, and contextual escaping.','区分校验、净化与按上下文转义。','Why is sanitizing stored text not a substitute for escaping HTML output?','为什么净化存储文本不能替代 HTML 输出转义？'],
    ['theme-json','theme.json & design settings','theme.json 与设计设置','Define consistent editor and frontend design tokens.','定义一致的编辑器与前端设计变量。','How can shared design settings prevent editor and frontend drift?','共享设计设置如何防止编辑器与前端样式偏离？','https://developer.wordpress.org/themes/'],
    ['query-loop','The Loop & query context','主循环与查询上下文','Render the intended content and restore modified global context.','渲染目标内容，并恢复修改后的全局上下文。','What can break after a custom loop leaves global post data changed?','自定义循环未恢复全局文章数据可能破坏什么？'],
    ['dynamic-blocks','Static & dynamic blocks','静态区块与动态区块','Choose saved markup or server rendering based on update behavior.','根据更新行为选择保存标记或服务端渲染。','Why can stored block markup require a migration after its structure changes?','保存的区块标记结构变化后为什么可能需要迁移？','https://developer.wordpress.org/block-editor/'],
    ['authorization','Object-level authorization','对象级授权','Check capabilities for the specific object being changed.','针对实际被修改对象检查权限。','Why is being logged in insufficient to edit another author’s draft?','已登录为什么不足以编辑其他作者的草稿？'],
    ['scheduled-work','Scheduled work & retries','计划任务与重试','Make background jobs repeat-safe and observable.','让后台任务可安全重复执行，并且可观测。','Why should a retried scheduled job not send the same receipt twice?','重试的计划任务为什么不能重复发送收据？'],
    ['plugin-compatibility','Plugin compatibility & dependency contracts','插件兼容性与依赖约束','Avoid global collisions and verify supported dependency versions.','避免全局命名冲突，并验证依赖版本。','How can a global function name collide with another plugin?','全局函数名如何与另一个插件冲突？'],
    ['cache-scope','Cache keys & user isolation','缓存键与用户隔离','Separate public content caches from personalized responses.','区分公共内容缓存与个性化响应。','What can leak if a private response is cached under only the URL?','私有响应仅按 URL 缓存会泄漏什么？'],
    ['content-migrations','Content & plugin data migrations','内容与插件数据迁移','Version stored data and make upgrades resumable.','为存储数据设版本，并让升级可恢复。','What happens if an interrupted upgrade is run again?','中断的升级再次运行时应该怎样处理？']
  ],
  'react-native':[
    ['device-setup','Device debugging & development builds','设备调试与开发构建','Distinguish simulator success from device behavior.','区分模拟器成功与真实设备行为。','Why can an API reachable through localhost on a desktop fail on a phone?','桌面 localhost 可访问的 API，为什么手机可能访问失败？'],
    ['safe-area','Safe areas & screen geometry','安全区域与屏幕几何','Keep controls usable around insets, rotation, and text scaling.','在安全边距、旋转与文字缩放下保留可用控件。','Why can a bottom button be hidden by a system gesture area?','底部按钮为什么可能被系统手势区域遮挡？'],
    ['press-interaction','Press feedback & touch targets','按压反馈与触摸目标','Provide reliable hit targets and disabled feedback.','提供可靠触摸范围与禁用反馈。','Why can a visually large icon still have a small touch target?','视觉上很大的图标，为什么触摸范围仍可能很小？'],
    ['app-lifecycle','App foreground & background lifecycle','应用前后台生命周期','Refresh stale state and release subscriptions appropriately.','合理刷新过期状态，并释放订阅。','What should happen to a stale request when the app resumes?','应用恢复到前台时，过期请求应如何处理？','https://reactnative.dev/docs/appstate'],
    ['offline-state','Offline state & synchronization','离线状态与同步','Distinguish pending local edits from server-confirmed changes.','区分本地待同步修改与服务端已确认变更。','How should a failed offline update appear after reconnection?','离线修改同步失败后，联网时应如何显示？'],
    ['deep-links','Deep links & navigation validation','深链接与导航校验','Validate incoming route parameters and protected destinations.','校验外部路由参数与受保护目标。','Why must a deep link not bypass authentication checks?','深链接为什么不能绕过身份验证？','https://reactnative.dev/docs/linking'],
    ['secure-storage','Sensitive storage & token lifecycle','敏感存储与令牌生命周期','Separate ordinary preferences from credentials and revocation.','区分普通偏好与凭证，并处理撤销。','Why should an authentication token not be treated as ordinary cached UI data?','为什么身份令牌不能作为普通界面缓存数据处理？','https://reactnative.dev/docs/security'],
    ['list-rendering','List virtualization & render stability','列表虚拟化与渲染稳定性','Diagnose expensive rows using representative device data.','通过有代表性的设备数据诊断高成本列表项。','Why can recreating every row prop worsen scrolling performance?','为什么重建每个列表项的属性可能拖慢滚动？'],
    ['release-upgrades','Native dependency upgrades','原生依赖升级','Rebuild and test native changes across supported platforms.','在受支持平台重新构建并测试原生变更。','Why can a JavaScript-only update not supply a missing native module?','为什么仅更新 JavaScript 无法补上缺失的原生模块？']
  ]
};

export function expandPath(path:LearningPath):LearningPath{
  const extra=additions[path.id];if(!extra)return path;
  const contexts:Record<LearningPath['category'],[string,string]>={frontend:['an editable customer-facing interface','可编辑的用户界面'],backend:['an order-processing service','订单处理服务'],database:['an order and inventory database','订单与库存数据库'],cloud:['a staged application release','分阶段应用发布']};
  const [scenario,scenarioZh]=contexts[path.category];
  const engineering:TopicSpec[]=[
    ['delivery-contract','Requirements & acceptance boundaries','需求与验收边界',`Define observable acceptance cases for ${scenario} using ${path.name.en}.`,`为基于 ${path.name.zh} 的${scenarioZh}定义可观测验收用例。`,'Which empty, invalid, and duplicate-input cases belong in the acceptance contract?','验收约束应包含哪些空值、非法输入与重复输入场景？'],
    ['quality-evidence','Regression & boundary evidence','回归与边界证据',`Protect ${scenario} with one valid case, one broken implementation, and an independent changed-input case.`,`为${scenarioZh}提供正确用例、错误实现与独立变更输入用例。`,'What test would fail for a plausible broken implementation but pass for the intended behavior?','什么测试能让合理但错误的实现失败，并让预期行为通过？'],
    ['change-review','Change review & recovery decisions','变更评审与恢复决策',`Review a backwards-compatible change to ${scenario} and identify failure recovery evidence.`,`评审${scenarioZh}的向后兼容变更，并明确失败恢复证据。`,'What must remain compatible during rollout, and what evidence justifies rollback?','逐步发布期间哪些行为必须兼容，什么证据足以触发回滚？']
  ];
  return {...path,stages:path.stages.map((stage,index)=>({...stage,topics:[...stage.topics,...pathStage(path.id,stage.id,stage.project,path.source,[...extra.slice(index*3,index*3+3),engineering[index]]).topics]}))};
}
