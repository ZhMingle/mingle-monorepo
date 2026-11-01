import { pathStage } from './path-types.ts';
import type { LearningPath } from './path-types.ts';

const django='https://docs.djangoproject.com/en/5.2/';
const angular='https://angular.dev/';
export const frameworkPaths:LearningPath[]=[{
  id:'django',name:{en:'Django',zh:'Django'},mark:'DJ',category:'backend',mode:'topics',source:django,
  description:{en:'Build validated, secure Python web applications with Django.',zh:'用 Django 构建经过校验、安全可靠的 Python Web 应用。'},
  prerequisite:{en:'Python functions, classes, virtual environments, and basic HTTP and SQL.',zh:'具备 Python 函数、类、虚拟环境及 HTTP、SQL 基础。'},stages:[
    pathStage('django','foundation',{en:'Build a task tracker with models, templates, forms, and admin tools.',zh:'构建包含模型、模板、表单和管理后台的任务管理应用。'},django,[
      ['setup','Projects, apps & settings','项目、应用与配置','Separate project configuration from reusable applications.','区分项目配置与可复用应用。','What differs between startproject and startapp?','startproject 和 startapp 有什么区别？',django+'intro/tutorial01/'],
      ['urls','URL routing & views','URL 路由与视图','Trace path parameters through a view to an HTTP response.','追踪路径参数经过视图生成 HTTP 响应的过程。','How should a missing task return a 404?','任务不存在时，如何返回 404？',django+'topics/http/urls/'],
      ['models','Models & relationships','模型与关系','Model fields, foreign keys, and deletion behavior.','设计字段、外键与删除行为。','What does on_delete control for a foreign key?','外键的 on_delete 控制什么？',django+'topics/db/models/'],
      ['migrations','Schema migrations','数据库结构迁移','Distinguish generating migration files from applying them.','区分生成迁移文件与执行迁移。','Does makemigrations change the database schema immediately?','makemigrations 会立即修改数据库结构吗？',django+'topics/migrations/'],
      ['querysets','QuerySets & lazy evaluation','QuerySet 与延迟求值','Filter and order records while identifying evaluation points.','筛选、排序记录，并识别求值时机。','When does constructing a QuerySet issue SQL?','构建 QuerySet 时，什么时候会执行 SQL？',django+'topics/db/queries/'],
      ['templates','Templates & escaping','模板与转义','Compose inherited templates and preserve automatic escaping.','组合继承模板，并保留自动转义。','Why is marking user content safe dangerous?','为什么将用户内容标记为 safe 有危险？',django+'topics/templates/'],
      ['forms','Forms & cleaned data','表单与清洗后数据','Validate bound forms before using cleaned_data.','先校验绑定的表单，再使用 cleaned_data。','Can request.POST replace validated cleaned_data?','request.POST 能替代已校验的 cleaned_data 吗？',django+'topics/forms/'],
      ['admin','Admin & model forms','管理后台与模型表单','Configure admin access and explicitly choose editable fields.','配置后台访问权限，并明确可编辑字段。','Why explicitly list fields in a public ModelForm?','公开的 ModelForm 为什么应显式列出字段？',django+'topics/forms/modelforms/']
    ]),
    pathStage('django','practice',{en:'Build a multi-user task application with permissions and regression tests.',zh:'构建带权限检查和回归测试的多用户任务应用。'},django,[
      ['auth','Authentication & sessions','身份认证与会话','Use Django authentication and session lifecycle APIs.','使用 Django 身份认证和会话生命周期 API。','Why should passwords use set_password rather than direct assignment?','密码为什么应通过 set_password 设置，而不是直接赋值？',django+'topics/auth/default/'],
      ['authorization','Object authorization','对象授权','Scope each read and write to resources the caller may access.','为每次读写限定调用者有权访问的资源。','Does login_required prove ownership of a task?','login_required 能证明用户拥有某个任务吗？',django+'topics/auth/default/'],
      ['csrf','CSRF & safe methods','CSRF 与安全方法','Protect state-changing requests and keep GET free of mutations.','保护修改状态的请求，并避免 GET 执行修改。','Why is a CSRF token not an ownership check?','为什么 CSRF 令牌不能替代资源归属检查？',django+'ref/csrf/'],
      ['generic-views','Generic views & mixins','通用视图与混入','Trace dispatch and customize querysets in class-based views.','追踪 dispatch，并在类视图中定制查询集。','Where should a ListView restrict records to the current user?','ListView 应在哪里将记录限制为当前用户的数据？',django+'topics/class-based-views/'],
      ['transactions','Atomic transactions','原子事务','Keep related writes atomic and defer side effects until commit.','让相关写入保持原子性，并在提交后执行外部副作用。','Why send a confirmation using on_commit?','为什么通过 on_commit 发送确认通知？',django+'topics/db/transactions/'],
      ['query-performance','Related data & N+1 queries','关联数据与 N+1 查询','Choose select_related or prefetch_related using relationship shape.','根据关联类型选择 select_related 或 prefetch_related。','How can rendering task owners issue one query per row?','渲染任务所有者时，如何产生每行一次的查询？',django+'topics/db/optimization/'],
      ['uploads','File uploads & storage','文件上传与存储','Validate uploads and separate untrusted media from executable content.','校验上传内容，并将不可信媒体与可执行内容隔离。','Is a filename extension enough to trust an upload?','只检查扩展名就能信任上传内容吗？',django+'topics/http/file-uploads/'],
      ['tests','Request & database tests','请求与数据库测试','Test successful requests, invalid input, and forbidden resource access.','测试正常请求、无效输入和越权访问。','Which test catches one user editing another user’s task?','哪个测试能发现用户修改他人任务的问题？',django+'topics/testing/overview/']
    ]),
    pathStage('django','advanced',{en:'Prepare a production release with concurrency protection, diagnostics, and recovery checks.',zh:'准备生产交付，包含并发保护、诊断与恢复检查。'},django,[
      ['concurrency','Concurrent updates & locks','并发更新与锁','Use database expressions or transactional locks for conflicting writes.','用数据库表达式或事务锁处理冲突写入。','Why can read-modify-save lose a concurrent increment?','读取、修改再保存为什么可能丢失并发增量？',django+'ref/models/querysets/'],
      ['constraints','Database constraints','数据库约束','Enforce invariants in the database as well as input validation.','在数据库中约束不变量，同时保留输入校验。','Can two requests both pass a uniqueness precheck?','两个请求能同时通过唯一性预检查吗？',django+'ref/models/constraints/'],
      ['caching','Caching & personalized data','缓存与个性化数据','Design cache keys and invalidation around identity and freshness.','围绕用户身份和新鲜度设计缓存键与失效。','How could a shared cache key expose another user’s dashboard?','共用缓存键如何泄露其他用户的仪表盘？',django+'topics/cache/'],
      ['async','Async views & boundaries','异步视图与边界','Distinguish async request handling from blocking dependencies.','区分异步请求处理与阻塞依赖。','Does async def make a blocking library nonblocking?','async def 能让阻塞库自动变为非阻塞吗？',django+'topics/async/'],
      ['middleware','Middleware & diagnostics','中间件与诊断','Order middleware and correlate errors without recording secrets.','合理排列中间件，并在不记录秘密的前提下关联错误。','How does middleware order affect request and response processing?','中间件顺序如何影响请求与响应处理？',django+'topics/http/middleware/'],
      ['deployment','Deployment & security settings','部署与安全配置','Review DEBUG, hosts, HTTPS, secrets, and static file delivery.','检查 DEBUG、主机限制、HTTPS、秘密与静态资源交付。','Why is runserver unsuitable as the production server?','为什么 runserver 不适合作为生产服务器？',django+'howto/deployment/checklist/'],
      ['migration-release','Safe data migrations','安全的数据迁移','Use historical models and plan compatibility across releases.','使用历史模型，并规划版本间兼容性。','Why use apps.get_model inside a data migration?','数据迁移中为什么使用 apps.get_model？',django+'topics/migrations/'],
      ['recovery','Recovery & release verification','恢复与发布验证','Verify backups, migration outcomes, and rollback assumptions.','验证备份、迁移结果与回滚假设。','Can reverting application code undo a destructive schema migration?','回退应用代码能撤销破坏性的数据库迁移吗？',django+'howto/deployment/']
    ])
  ]
},{
  id:'angular',name:{en:'Angular',zh:'Angular'},mark:'A',category:'frontend',mode:'topics',source:angular,
  description:{en:'Build typed applications with components, signals, routing, and dependency injection.',zh:'用组件、信号、路由和依赖注入构建类型明确的应用。'},
  prerequisite:{en:'HTML, CSS, JavaScript modules, and TypeScript fundamentals.',zh:'具备 HTML、CSS、JavaScript 模块与 TypeScript 基础。'},stages:[
    pathStage('angular','foundation',{en:'Build a standalone task board with typed components and reactive state.',zh:'用独立组件和响应式状态构建类型明确的任务看板。'},angular,[
      ['components','Standalone components','独立组件','Declare component metadata and import template dependencies.','声明组件元数据，并导入模板依赖。','Where does a standalone component declare a child dependency?','独立组件在哪里声明子组件依赖？',angular+'guide/components'],
      ['bindings','Templates & event bindings','模板与事件绑定','Connect properties and events without direct DOM mutation.','通过属性与事件连接界面，避免直接修改 DOM。','How do property binding and event binding differ?','属性绑定与事件绑定有什么区别？',angular+'guide/templates/binding'],
      ['control-flow','Control flow & tracking','控制流与跟踪键','Render conditional and repeated content with stable identity.','按条件和列表渲染内容，并保持稳定身份。','Why track a reorderable task list by task.id?','可重排的任务列表为什么应跟踪 task.id？',angular+'guide/templates/control-flow'],
      ['signals','Signals & computed state','信号与计算状态','Update writable signals and derive values with computed.','更新可写信号，并用 computed 派生数值。','Does mutating an object inside a signal automatically notify consumers?','直接修改信号内部对象会自动通知使用者吗？',angular+'guide/signals'],
      ['inputs','Inputs & outputs','输入与输出','Pass typed data down and emit user intent upward.','向下传递类型明确的数据，向上发出用户意图。','Who should own state shared by two sibling components?','两个兄弟组件共享的状态应由谁持有？',angular+'guide/components/inputs'],
      ['di','Services & dependency injection','服务与依赖注入','Provide services at the scope that owns their state.','在拥有相应状态的作用域提供服务。','How can a component provider create a separate service instance?','组件级 provider 如何创建独立服务实例？',angular+'guide/di'],
      ['pipes','Pipes & presentation','管道与展示逻辑','Format displayed values without hiding business mutations.','格式化展示值，避免隐藏业务修改。','Should a formatting pipe save a record to the server?','格式化管道应该向服务器保存记录吗？',angular+'guide/templates/pipes'],
      ['lifecycle','Lifecycle & cleanup','生命周期与清理','Access initialized views and release owned resources on destruction.','访问初始化后的视图，并在销毁时释放自有资源。','What happens to an interval if its component never clears it?','组件从不清理定时器会发生什么？',angular+'guide/components/lifecycle']
    ]),
    pathStage('angular','practice',{en:'Build a routed dashboard with validated forms, HTTP loading, and error handling.',zh:'构建带路由、表单校验、HTTP 加载和错误处理的仪表盘。'},angular,[
      ['routing','Routes & parameters','路由与参数','Map nested views and respond to route parameter changes.','映射嵌套视图，并响应路由参数变化。','Can a reused component receive a new route id without reconstruction?','复用的组件能在不重新创建时收到新的路由 id 吗？',angular+'guide/routing'],
      ['forms','Reactive forms & validation','响应式表单与校验','Model typed form controls and expose meaningful validation states.','建模类型明确的表单控件，并展示有意义的校验状态。','Why must the server validate a form that passed client validation?','表单通过客户端校验后，为什么服务端仍需校验？',angular+'guide/forms/reactive-forms'],
      ['http','HttpClient & response contracts','HttpClient 与响应约束','Handle loading and errors while validating untrusted data.','处理加载与错误，并校验不可信数据。','Does http.get<User> validate the JSON at runtime?','http.get<User> 会在运行时校验 JSON 吗？',angular+'guide/http'],
      ['streams','Observable composition','可观察流组合','Compose request streams and avoid nested subscriptions.','组合请求流，避免嵌套订阅。','How can switchMap stop an older search result replacing a newer one?','switchMap 如何防止旧搜索结果替换新结果？',angular+'guide/http/making-requests'],
      ['interop','Signals & RxJS interop','信号与 RxJS 互操作','Bridge observable values into signals with deliberate subscription ownership.','将可观察值接入信号，并明确订阅归属。','Why avoid repeatedly calling toSignal for the same stream?','为什么避免对同一条流重复调用 toSignal？',angular+'ecosystem/rxjs-interop'],
      ['interceptors','HTTP interceptors','HTTP 拦截器','Apply cross-cutting request policies with bounded retries.','应用通用请求策略，并限制重试次数。','Why can automatically retrying a POST duplicate work?','自动重试 POST 为什么可能重复执行操作？',angular+'guide/http/interceptors'],
      ['guards','Guards & server authorization','路由守卫与服务端授权','Use guards for navigation while enforcing access on the server.','用守卫控制导航，同时在服务端落实访问检查。','Can a client-side route guard secure an API?','客户端路由守卫能保护 API 吗？',angular+'guide/routing/route-guards'],
      ['testing','Component & HTTP tests','组件与 HTTP 测试','Test visible interactions and deterministic HTTP success and failure.','测试可见交互，以及确定性的 HTTP 成功和失败。','What test catches a loading indicator that remains after an error?','什么测试能发现请求报错后仍显示加载的问题？',angular+'guide/testing']
    ]),
    pathStage('angular','advanced',{en:'Deliver an accessible, measured application with SSR checks and a tested upgrade plan.',zh:'交付可访问、经过性能测量的应用，包含 SSR 检查与升级验证方案。'},angular,[
      ['state-architecture','State ownership & feature boundaries','状态归属与功能边界','Separate local UI state from shared feature services.','区分局部界面状态与共享功能服务。','When should a feature service be scoped below the application root?','功能服务什么时候应限制在应用根级以下的作用域？',angular+'guide/di/hierarchical-dependency-injection'],
      ['performance','Change detection & profiling','变更检测与性能分析','Use profiling to locate expensive updates before optimizing.','先用性能分析定位高成本更新，再优化。','What evidence would justify changing a component detection strategy?','什么证据足以支持调整组件的检测策略？',angular+'best-practices/runtime-performance'],
      ['lazy-loading','Lazy routes & deferred views','懒加载路由与延迟视图','Defer optional code while preserving loading and failure feedback.','延后加载可选代码，同时保留加载与失败反馈。','What should users see while a deferred dependency loads?','延迟依赖加载时，用户应看到什么？',angular+'guide/templates/defer'],
      ['ssr','SSR & browser boundaries','服务端渲染与浏览器边界','Keep browser-only APIs outside server execution paths.','让仅限浏览器的 API 避开服务端执行路径。','Why can reading window during rendering fail on the server?','渲染期间读取 window 为什么可能在服务端失败？',angular+'guide/ssr'],
      ['hydration','Hydration & DOM consistency','水合与 DOM 一致性','Keep server and client DOM compatible during hydration.','水合期间保持服务端与客户端 DOM 兼容。','How can direct DOM changes cause a hydration mismatch?','直接修改 DOM 如何造成水合不匹配？',angular+'guide/hydration'],
      ['security','Template security & trust','模板安全与信任边界','Preserve sanitization and review any bypass of security checks.','保留净化机制，并审查任何绕过安全检查的操作。','Why is bypassSecurityTrustHtml dangerous for user input?','对用户输入使用 bypassSecurityTrustHtml 为什么危险？',angular+'best-practices/security'],
      ['accessibility','Accessible interaction & focus','可访问交互与焦点','Test keyboard navigation, names, and focus after navigation.','测试键盘导航、可访问名称与页面导航后的焦点。','Where should focus move after opening and closing a dialog?','对话框打开和关闭后，焦点应移到哪里？',angular+'best-practices/a11y'],
      ['upgrades','Builds, upgrades & release checks','构建、升级与发布检查','Declare framework versions and verify migrations with production builds and tests.','明确框架版本，并通过生产构建与测试验证迁移。','Why do successful update schematics still require behavioral tests?','升级脚本成功后，为什么仍需行为测试？',angular+'update-guide']
    ])
  ]
}];
