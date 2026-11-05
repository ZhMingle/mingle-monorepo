import type { LearningPath } from './path-types.ts';
export const dotnetFrameworkPaths:LearningPath[]=[
  {
    "id": "aspnet-core",
    "name": {
      "en": "ASP.NET Core",
      "zh": "ASP.NET Core"
    },
    "mark": "ASP",
    "category": "backend",
    "mode": "topics",
    "source": "https://learn.microsoft.com/en-us/aspnet/core/",
    "prerequisite": {
      "en": "C# & .NET fundamentals, HTTP and basic SQL.",
      "zh": "C# 与 .NET 基础、HTTP 和 SQL 基础。"
    },
    "description": {
      "en": "Build secure web APIs with explicit contracts and verified delivery.",
      "zh": "构建接口约束明确、经过交付验证的安全 Web API。"
    },
    "stages": [
      {
        "id": "foundation",
        "project": {
          "en": "Build a validated task API.",
          "zh": "构建带校验的任务 API。"
        },
        "topics": [
          {
            "id": "aspnet-core.hosting",
            "title": {
              "en": "Hosting & startup",
              "zh": "宿主与启动"
            },
            "goal": {
              "en": "Apply hosting & startup to a task application and explain its failure cases.",
              "zh": "在任务应用中运用宿主与启动，并解释失败情况。"
            },
            "check": {
              "en": "Why register services before Build?",
              "zh": "为什么在 Build 前注册服务？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.routing",
            "title": {
              "en": "Routes & verbs",
              "zh": "路由与动词"
            },
            "goal": {
              "en": "Apply routes & verbs to a task application and explain its failure cases.",
              "zh": "在任务应用中运用路由与动词，并解释失败情况。"
            },
            "check": {
              "en": "How do 404 and 405 differ?",
              "zh": "404 与 405 有什么区别？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.minimal",
            "title": {
              "en": "Minimal APIs",
              "zh": "Minimal API"
            },
            "goal": {
              "en": "Apply minimal apis to a task application and explain its failure cases.",
              "zh": "在任务应用中运用Minimal API，并解释失败情况。"
            },
            "check": {
              "en": "When should an endpoint return NotFound?",
              "zh": "端点何时应返回 NotFound？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.controllers",
            "title": {
              "en": "Controllers",
              "zh": "控制器"
            },
            "goal": {
              "en": "Apply controllers to a task application and explain its failure cases.",
              "zh": "在任务应用中运用控制器，并解释失败情况。"
            },
            "check": {
              "en": "What does ApiController do for invalid models?",
              "zh": "ApiController 如何处理无效模型？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.binding",
            "title": {
              "en": "Parameter binding",
              "zh": "参数绑定"
            },
            "goal": {
              "en": "Apply parameter binding to a task application and explain its failure cases.",
              "zh": "在任务应用中运用参数绑定，并解释失败情况。"
            },
            "check": {
              "en": "How do route, query and body binding differ?",
              "zh": "路由、查询和请求体绑定有何区别？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.validation",
            "title": {
              "en": "DTO validation",
              "zh": "DTO 校验"
            },
            "goal": {
              "en": "Apply dto validation to a task application and explain its failure cases.",
              "zh": "在任务应用中运用DTO 校验，并解释失败情况。"
            },
            "check": {
              "en": "Does valid JSON imply valid business input?",
              "zh": "有效 JSON 代表业务输入有效吗？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.di",
            "title": {
              "en": "DI lifetimes",
              "zh": "依赖注入生命周期"
            },
            "goal": {
              "en": "Apply di lifetimes to a task application and explain its failure cases.",
              "zh": "在任务应用中运用依赖注入生命周期，并解释失败情况。"
            },
            "check": {
              "en": "Why must a singleton not capture a scoped service?",
              "zh": "单例为什么不能持有作用域服务？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.options",
            "title": {
              "en": "Configuration & options",
              "zh": "配置与选项"
            },
            "goal": {
              "en": "Apply configuration & options to a task application and explain its failure cases.",
              "zh": "在任务应用中运用配置与选项，并解释失败情况。"
            },
            "check": {
              "en": "How do environment variables override JSON settings?",
              "zh": "环境变量如何覆盖 JSON 配置？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          }
        ]
      },
      {
        "id": "practice",
        "project": {
          "en": "Add authorization and integration tests.",
          "zh": "加入授权与集成测试。"
        },
        "topics": [
          {
            "id": "aspnet-core.middleware",
            "title": {
              "en": "Middleware order",
              "zh": "中间件顺序"
            },
            "goal": {
              "en": "Apply middleware order to a task application and explain its failure cases.",
              "zh": "在任务应用中运用中间件顺序，并解释失败情况。"
            },
            "check": {
              "en": "What happens when next is never called?",
              "zh": "不调用 next 会发生什么？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.errors",
            "title": {
              "en": "Problem Details",
              "zh": "问题详情"
            },
            "goal": {
              "en": "Apply problem details to a task application and explain its failure cases.",
              "zh": "在任务应用中运用问题详情，并解释失败情况。"
            },
            "check": {
              "en": "Why hide internal exception details from clients?",
              "zh": "为什么对客户端隐藏内部异常细节？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.async",
            "title": {
              "en": "Async & cancellation",
              "zh": "异步与取消"
            },
            "goal": {
              "en": "Apply async & cancellation to a task application and explain its failure cases.",
              "zh": "在任务应用中运用异步与取消，并解释失败情况。"
            },
            "check": {
              "en": "Where should RequestAborted be propagated?",
              "zh": "RequestAborted 应传递到哪里？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.authentication",
            "title": {
              "en": "Authentication",
              "zh": "身份认证"
            },
            "goal": {
              "en": "Apply authentication to a task application and explain its failure cases.",
              "zh": "在任务应用中运用身份认证，并解释失败情况。"
            },
            "check": {
              "en": "How does authentication differ from authorization?",
              "zh": "认证与授权有何区别？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.authorization",
            "title": {
              "en": "Resource authorization",
              "zh": "资源授权"
            },
            "goal": {
              "en": "Apply resource authorization to a task application and explain its failure cases.",
              "zh": "在任务应用中运用资源授权，并解释失败情况。"
            },
            "check": {
              "en": "Does a valid token prove record ownership?",
              "zh": "有效令牌能证明记录归属吗？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.security",
            "title": {
              "en": "CORS & CSRF",
              "zh": "CORS 与 CSRF"
            },
            "goal": {
              "en": "Apply cors & csrf to a task application and explain its failure cases.",
              "zh": "在任务应用中运用CORS 与 CSRF，并解释失败情况。"
            },
            "check": {
              "en": "Can CORS replace CSRF protection for cookie authentication?",
              "zh": "CORS 能替代 Cookie 认证的 CSRF 防护吗？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.httpclient",
            "title": {
              "en": "HttpClient factory",
              "zh": "HttpClient 工厂"
            },
            "goal": {
              "en": "Apply httpclient factory to a task application and explain its failure cases.",
              "zh": "在任务应用中运用HttpClient 工厂，并解释失败情况。"
            },
            "check": {
              "en": "Why bound timeouts and retries for outgoing requests?",
              "zh": "外发请求为什么应限制超时和重试？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.tests",
            "title": {
              "en": "Integration tests",
              "zh": "集成测试"
            },
            "goal": {
              "en": "Apply integration tests to a task application and explain its failure cases.",
              "zh": "在任务应用中运用集成测试，并解释失败情况。"
            },
            "check": {
              "en": "How can WebApplicationFactory test forbidden writes?",
              "zh": "WebApplicationFactory 如何测试未授权写入？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          }
        ]
      },
      {
        "id": "advanced",
        "project": {
          "en": "Verify observable delivery and rollback.",
          "zh": "验证可观测的交付与回滚。"
        },
        "topics": [
          {
            "id": "aspnet-core.openapi",
            "title": {
              "en": "OpenAPI & contracts",
              "zh": "OpenAPI 与接口约束"
            },
            "goal": {
              "en": "Apply openapi & contracts to a task application and explain its failure cases.",
              "zh": "在任务应用中运用OpenAPI 与接口约束，并解释失败情况。"
            },
            "check": {
              "en": "Can renaming a response field break clients?",
              "zh": "响应字段改名会破坏客户端吗？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.logging",
            "title": {
              "en": "Structured logging",
              "zh": "结构化日志"
            },
            "goal": {
              "en": "Apply structured logging to a task application and explain its failure cases.",
              "zh": "在任务应用中运用结构化日志，并解释失败情况。"
            },
            "check": {
              "en": "Why avoid logging access tokens?",
              "zh": "为什么避免记录访问令牌？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.health",
            "title": {
              "en": "Liveness & readiness",
              "zh": "存活与就绪"
            },
            "goal": {
              "en": "Apply liveness & readiness to a task application and explain its failure cases.",
              "zh": "在任务应用中运用存活与就绪，并解释失败情况。"
            },
            "check": {
              "en": "Should dependency failure always trigger a restart?",
              "zh": "依赖故障总应触发重启吗？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.background",
            "title": {
              "en": "Background services",
              "zh": "后台服务"
            },
            "goal": {
              "en": "Apply background services to a task application and explain its failure cases.",
              "zh": "在任务应用中运用后台服务，并解释失败情况。"
            },
            "check": {
              "en": "Why create a scope for background database work?",
              "zh": "后台数据库任务为什么要创建作用域？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.rate-limits",
            "title": {
              "en": "Rate limiting",
              "zh": "速率限制"
            },
            "goal": {
              "en": "Apply rate limiting to a task application and explain its failure cases.",
              "zh": "在任务应用中运用速率限制，并解释失败情况。"
            },
            "check": {
              "en": "How can a global limit penalize unrelated users?",
              "zh": "全局限流如何影响无关用户？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.caching",
            "title": {
              "en": "Output caching",
              "zh": "输出缓存"
            },
            "goal": {
              "en": "Apply output caching to a task application and explain its failure cases.",
              "zh": "在任务应用中运用输出缓存，并解释失败情况。"
            },
            "check": {
              "en": "How can caching personalized responses leak data?",
              "zh": "缓存个性化响应如何泄露数据？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.proxy",
            "title": {
              "en": "Reverse proxies",
              "zh": "反向代理"
            },
            "goal": {
              "en": "Apply reverse proxies to a task application and explain its failure cases.",
              "zh": "在任务应用中运用反向代理，并解释失败情况。"
            },
            "check": {
              "en": "Why restrict trusted forwarded-header sources?",
              "zh": "为什么限制转发头的可信来源？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          },
          {
            "id": "aspnet-core.release",
            "title": {
              "en": "Release & recovery",
              "zh": "发布与恢复"
            },
            "goal": {
              "en": "Apply release & recovery to a task application and explain its failure cases.",
              "zh": "在任务应用中运用发布与恢复，并解释失败情况。"
            },
            "check": {
              "en": "What evidence proves rollback preserves data?",
              "zh": "什么证据能证明回滚保留数据？"
            },
            "source": "https://learn.microsoft.com/en-us/aspnet/core/"
          }
        ]
      }
    ]
  },
  {
    "id": "ef-core",
    "name": {
      "en": "EF Core",
      "zh": "EF Core"
    },
    "mark": "EF",
    "category": "backend",
    "mode": "topics",
    "source": "https://learn.microsoft.com/en-us/ef/core/",
    "prerequisite": {
      "en": "C# & .NET, LINQ and relational SQL; ASP.NET Core for API integration.",
      "zh": "C# 与 .NET、LINQ 和关系型 SQL；结合 API 时先学习 ASP.NET Core。"
    },
    "description": {
      "en": "Persist .NET data with safe queries, updates and reviewed migrations.",
      "zh": "通过安全查询、更新与经过审查的迁移持久化 .NET 数据。"
    },
    "stages": [
      {
        "id": "foundation",
        "project": {
          "en": "Model tasks and review CRUD and migrations.",
          "zh": "建模任务并审查增删改查和迁移。"
        },
        "topics": [
          {
            "id": "ef-core.context",
            "title": {
              "en": "DbContext lifetime",
              "zh": "DbContext 生命周期"
            },
            "goal": {
              "en": "Apply dbcontext lifetime to a task application and explain its failure cases.",
              "zh": "在任务应用中运用DbContext 生命周期，并解释失败情况。"
            },
            "check": {
              "en": "Can one context safely run parallel operations?",
              "zh": "同一上下文能安全并行执行操作吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.providers",
            "title": {
              "en": "Database providers",
              "zh": "数据库提供程序"
            },
            "goal": {
              "en": "Apply database providers to a task application and explain its failure cases.",
              "zh": "在任务应用中运用数据库提供程序，并解释失败情况。"
            },
            "check": {
              "en": "Does every provider translate the same LINQ?",
              "zh": "所有提供程序都能翻译同一 LINQ 吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.keys",
            "title": {
              "en": "Entities & keys",
              "zh": "实体与主键"
            },
            "goal": {
              "en": "Apply entities & keys to a task application and explain its failure cases.",
              "zh": "在任务应用中运用实体与主键，并解释失败情况。"
            },
            "check": {
              "en": "Why does tracking need stable entity keys?",
              "zh": "跟踪为什么需要稳定实体主键？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.mapping",
            "title": {
              "en": "Model configuration",
              "zh": "模型配置"
            },
            "goal": {
              "en": "Apply model configuration to a task application and explain its failure cases.",
              "zh": "在任务应用中运用模型配置，并解释失败情况。"
            },
            "check": {
              "en": "How do required fields and column precision affect writes?",
              "zh": "必填字段与列精度如何影响写入？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.relations",
            "title": {
              "en": "Relationships & foreign keys",
              "zh": "关系与外键"
            },
            "goal": {
              "en": "Apply relationships & foreign keys to a task application and explain its failure cases.",
              "zh": "在任务应用中运用关系与外键，并解释失败情况。"
            },
            "check": {
              "en": "How does delete behavior affect dependent records?",
              "zh": "删除行为如何影响从属记录？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.linq",
            "title": {
              "en": "LINQ translation",
              "zh": "LINQ 翻译"
            },
            "goal": {
              "en": "Apply linq translation to a task application and explain its failure cases.",
              "zh": "在任务应用中运用LINQ 翻译，并解释失败情况。"
            },
            "check": {
              "en": "How does ToList before Where change execution?",
              "zh": "Where 前调用 ToList 如何改变执行？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.crud",
            "title": {
              "en": "CRUD & SaveChanges",
              "zh": "增删改查与保存"
            },
            "goal": {
              "en": "Apply crud & savechanges to a task application and explain its failure cases.",
              "zh": "在任务应用中运用增删改查与保存，并解释失败情况。"
            },
            "check": {
              "en": "Does Add immediately insert a row?",
              "zh": "Add 会立即插入行吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.migrations",
            "title": {
              "en": "Migrations & snapshots",
              "zh": "迁移与快照"
            },
            "goal": {
              "en": "Apply migrations & snapshots to a task application and explain its failure cases.",
              "zh": "在任务应用中运用迁移与快照，并解释失败情况。"
            },
            "check": {
              "en": "Does creating a migration update the database?",
              "zh": "创建迁移会更新数据库吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          }
        ]
      },
      {
        "id": "practice",
        "project": {
          "en": "Test paged queries and concurrent updates.",
          "zh": "测试分页查询与并发更新。"
        },
        "topics": [
          {
            "id": "ef-core.tracking",
            "title": {
              "en": "Tracking & identity",
              "zh": "跟踪与身份"
            },
            "goal": {
              "en": "Apply tracking & identity to a task application and explain its failure cases.",
              "zh": "在任务应用中运用跟踪与身份，并解释失败情况。"
            },
            "check": {
              "en": "Will editing an untracked entity persist automatically?",
              "zh": "修改未跟踪实体会自动持久化吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.projection",
            "title": {
              "en": "DTO projection",
              "zh": "DTO 投影"
            },
            "goal": {
              "en": "Apply dto projection to a task application and explain its failure cases.",
              "zh": "在任务应用中运用DTO 投影，并解释失败情况。"
            },
            "check": {
              "en": "Can projections containing entities still track them?",
              "zh": "包含实体的投影仍会跟踪实体吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.loading",
            "title": {
              "en": "Related loading & N+1",
              "zh": "关联加载与 N+1"
            },
            "goal": {
              "en": "Apply related loading & n+1 to a task application and explain its failure cases.",
              "zh": "在任务应用中运用关联加载与 N+1，并解释失败情况。"
            },
            "check": {
              "en": "How can navigation access trigger one query per row?",
              "zh": "导航属性访问如何触发每行一次查询？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.paging",
            "title": {
              "en": "Stable pagination",
              "zh": "稳定分页"
            },
            "goal": {
              "en": "Apply stable pagination to a task application and explain its failure cases.",
              "zh": "在任务应用中运用稳定分页，并解释失败情况。"
            },
            "check": {
              "en": "Why add a unique key to timestamp ordering?",
              "zh": "按时间排序为什么还要添加唯一键？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.indexes",
            "title": {
              "en": "Indexes & query plans",
              "zh": "索引与查询计划"
            },
            "goal": {
              "en": "Apply indexes & query plans to a task application and explain its failure cases.",
              "zh": "在任务应用中运用索引与查询计划，并解释失败情况。"
            },
            "check": {
              "en": "Can a function on an indexed column prevent index seeking?",
              "zh": "索引列上的函数会阻碍索引查找吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.transactions",
            "title": {
              "en": "Transactions",
              "zh": "事务"
            },
            "goal": {
              "en": "Apply transactions to a task application and explain its failure cases.",
              "zh": "在任务应用中运用事务，并解释失败情况。"
            },
            "check": {
              "en": "Are separate SaveChanges calls always one transaction?",
              "zh": "多次 SaveChanges 总是同一事务吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.concurrency",
            "title": {
              "en": "Optimistic concurrency",
              "zh": "乐观并发"
            },
            "goal": {
              "en": "Apply optimistic concurrency to a task application and explain its failure cases.",
              "zh": "在任务应用中运用乐观并发，并解释失败情况。"
            },
            "check": {
              "en": "How should a concurrency-token conflict be resolved?",
              "zh": "如何处理并发令牌冲突？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.tests",
            "title": {
              "en": "Relational tests",
              "zh": "关系数据库测试"
            },
            "goal": {
              "en": "Apply relational tests to a task application and explain its failure cases.",
              "zh": "在任务应用中运用关系数据库测试，并解释失败情况。"
            },
            "check": {
              "en": "Can InMemory prove SQL translation correctness?",
              "zh": "InMemory 能证明 SQL 翻译正确吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          }
        ]
      },
      {
        "id": "advanced",
        "project": {
          "en": "Measure query performance and verify schema recovery.",
          "zh": "测量查询性能并验证结构恢复。"
        },
        "topics": [
          {
            "id": "ef-core.bulk",
            "title": {
              "en": "ExecuteUpdate & Delete",
              "zh": "批量更新与删除"
            },
            "goal": {
              "en": "Apply executeupdate & delete to a task application and explain its failure cases.",
              "zh": "在任务应用中运用批量更新与删除，并解释失败情况。"
            },
            "check": {
              "en": "Does ExecuteUpdate synchronize tracked entities?",
              "zh": "ExecuteUpdate 会同步已跟踪实体吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.sql",
            "title": {
              "en": "Parameterized SQL",
              "zh": "参数化 SQL"
            },
            "goal": {
              "en": "Apply parameterized sql to a task application and explain its failure cases.",
              "zh": "在任务应用中运用参数化 SQL，并解释失败情况。"
            },
            "check": {
              "en": "Can a table name be passed as a value parameter?",
              "zh": "表名能作为值参数传入吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.filters",
            "title": {
              "en": "Tenant query filters",
              "zh": "租户查询筛选"
            },
            "goal": {
              "en": "Apply tenant query filters to a task application and explain its failure cases.",
              "zh": "在任务应用中运用租户查询筛选，并解释失败情况。"
            },
            "check": {
              "en": "Why review every IgnoreQueryFilters call?",
              "zh": "为什么审查每次 IgnoreQueryFilters 调用？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.retries",
            "title": {
              "en": "Retries & idempotency",
              "zh": "重试与幂等性"
            },
            "goal": {
              "en": "Apply retries & idempotency to a task application and explain its failure cases.",
              "zh": "在任务应用中运用重试与幂等性，并解释失败情况。"
            },
            "check": {
              "en": "Can a retry duplicate an external notification?",
              "zh": "重试会重复发送外部通知吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.pooling",
            "title": {
              "en": "Context pooling",
              "zh": "上下文池"
            },
            "goal": {
              "en": "Apply context pooling to a task application and explain its failure cases.",
              "zh": "在任务应用中运用上下文池，并解释失败情况。"
            },
            "check": {
              "en": "How can pooled contexts retain unsafe tenant state?",
              "zh": "池化上下文如何保留不安全的租户状态？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.diagnostics",
            "title": {
              "en": "SQL diagnostics",
              "zh": "SQL 诊断"
            },
            "goal": {
              "en": "Apply sql diagnostics to a task application and explain its failure cases.",
              "zh": "在任务应用中运用SQL 诊断，并解释失败情况。"
            },
            "check": {
              "en": "Why disable sensitive data logging in production?",
              "zh": "为什么在生产关闭敏感数据日志？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.evolution",
            "title": {
              "en": "Compatible schema changes",
              "zh": "兼容结构变更"
            },
            "goal": {
              "en": "Apply compatible schema changes to a task application and explain its failure cases.",
              "zh": "在任务应用中运用兼容结构变更，并解释失败情况。"
            },
            "check": {
              "en": "Why stage additive changes before dropping columns?",
              "zh": "为什么删除列前先分阶段增量变更？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          },
          {
            "id": "ef-core.recovery",
            "title": {
              "en": "Migration release & recovery",
              "zh": "迁移发布与恢复"
            },
            "goal": {
              "en": "Apply migration release & recovery to a task application and explain its failure cases.",
              "zh": "在任务应用中运用迁移发布与恢复，并解释失败情况。"
            },
            "check": {
              "en": "Does reverting code restore dropped data?",
              "zh": "回退代码会恢复已删除数据吗？"
            },
            "source": "https://learn.microsoft.com/en-us/ef/core/"
          }
        ]
      }
    ]
  }
];
