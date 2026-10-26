import { pathStage } from './path-types.ts';
import type { LearningPath } from './path-types.ts';
const source = 'https://learn.microsoft.com/en-us/dotnet/csharp/';
export const backendPaths: LearningPath[] = [{
  id:'dotnet', name:{en:'C# & .NET',zh:'C# 与 .NET'},mark:'C#',category:'backend',mode:'topics',source,
  description:{en:'From C# fundamentals to reliable, observable web APIs.',zh:'从 C# 基础到可靠、可观测的 Web API。'},
  prerequisite:{en:'Basic programming and HTTP concepts.',zh:'具备基本编程和 HTTP 概念。'},stages:[
    pathStage('dotnet','foundation',{en:'Build a command-line task tracker.',zh:'编写命令行任务管理工具。'},source,[
      ['types','Types & nullability','类型与可空性','Distinguish value copies, references, and nullable contracts.','区分值复制、引用与可空约束。','Does copying a List variable copy its items?','复制 List 变量会复制其中的元素吗？'],
      ['collections','Collections & generics','集合与泛型','Choose lists, dictionaries, and generic contracts.','选择列表、字典和泛型约束。','When would a dictionary improve repeated lookups?','反复查找时，字典何时更合适？'],
      ['resources','Exceptions & resource disposal','异常与资源释放','Handle failure and release disposable resources with using.','处理失败，并用 using 释放可释放资源。','Does garbage collection guarantee timely file-handle release?','垃圾回收能保证及时释放文件句柄吗？'],
      ['linq','LINQ & deferred execution','LINQ 与延迟执行','Separate query construction from enumeration.','区分查询构建与实际枚举。','What can change if an IEnumerable query is enumerated twice?','对 IEnumerable 查询枚举两次，结果或成本可能怎样变化？']
    ]),
    pathStage('dotnet','practice',{en:'Build a validated, cancellable task API.',zh:'搭建支持校验和取消的任务 API。'},'https://learn.microsoft.com/en-us/aspnet/core/',[
      ['async','async, await & cancellation','异步、等待与取消','Compose asynchronous I/O and propagate cancellation.','组合异步 I/O，并传递取消信号。','Why can .Result be harmful inside a request handler?','请求处理器中使用 .Result 为什么可能有害？'],
      ['pipeline','HTTP & middleware','HTTP 与中间件','Trace requests through ordered middleware.','追踪请求经过有序中间件的过程。','What changes when authentication and authorization middleware are reordered?','认证与授权中间件顺序改变会有什么影响？'],
      ['di','Dependency injection lifetimes','依赖注入生命周期','Match singleton, scoped, and transient lifetimes to ownership.','按资源归属选择单例、作用域与瞬态生命周期。','Why is capturing a scoped service in a singleton risky?','单例捕获作用域服务为什么有风险？'],
      ['api','API contracts & authorization','API 约束与授权','Validate input and check access to individual resources.','校验输入，并检查具体资源的访问权限。','Does an authenticated user automatically own the requested record?','已登录用户就一定有权访问请求的记录吗？']
    ]),
    pathStage('dotnet','advanced',{en:'Add persistence, integration tests, and diagnostics to the API.',zh:'为 API 添加持久化、集成测试与诊断。'},'https://learn.microsoft.com/en-us/dotnet/',[
      ['ef','EF Core query behavior','EF Core 查询行为','Inspect tracking, generated SQL, and N+1 queries.','检查跟踪、生成的 SQL 与 N+1 查询。','How can a loop over navigation properties multiply database requests?','遍历导航属性为什么可能增加数据库请求次数？','https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying'],
      ['concurrency','Transactions & concurrency','事务与并发更新','Protect multi-step changes and detect conflicting writes.','保护多步骤修改，并识别并发写入冲突。','How would you prevent two requests from silently overwriting one record?','如何避免两个请求悄悄覆盖同一条记录？','https://learn.microsoft.com/en-us/ef/core/saving/concurrency'],
      ['tests','Integration testing','集成测试','Test the HTTP boundary and persistence behavior together.','联合验证 HTTP 边界和持久化行为。','Which database failures can mocked repository tests miss?','模拟仓储的测试可能漏掉哪些数据库问题？','https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests'],
      ['diagnostics','Runtime & diagnostics','运行时与性能诊断','Use traces, metrics, and allocation evidence before optimizing.','先用追踪、指标与分配证据定位问题，再优化。','How would you distinguish CPU pressure from slow external I/O?','如何区分 CPU 压力和外部 I/O 缓慢？','https://learn.microsoft.com/en-us/dotnet/core/diagnostics/']
    ])
  ]
}];
