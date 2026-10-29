import {pathStage} from './path-types.ts';
import type {LearningPath,TopicSpec} from './path-types.ts';
type Row=[string,string,string,string,string,string,string];
function stages(id:LearningPath['id'],source:string,rows:Row[],projects:[string,string][]){
  return (['foundation','practice','advanced'] as const).map((stage,i)=>pathStage(id,stage,{en:projects[i][0],zh:projects[i][1]},source,rows.slice(i*4,i*4+4) as TopicSpec[]));
}
export const languagePaths:LearningPath[]=[
  {id:'java',name:{en:'Java',zh:'Java'},mark:'J',category:'backend',mode:'topics',source:'https://dev.java/learn/',
    description:{en:'Build typed domain models, reliable services, and concurrent Java programs.',zh:'从类型与领域建模，到可靠服务、并发与 JVM 诊断。'},
    prerequisite:{en:'Basic programming and HTTP. Exercises use Java 21, standard libraries, and no preview features.',zh:'具备基本编程与 HTTP 知识。题目采用 Java 21 标准库，不使用预览特性。'},
    stages:stages('java','https://dev.java/learn/',[
      ['types','Types, values & null','类型、值与空值','Handle primitives, wrappers, and nullable values explicitly.','明确处理基本类型、包装类型与空值。','What happens when a null Integer is unboxed?','对 null Integer 自动拆箱会发生什么？'],
      ['objects','Classes, records & encapsulation','类、记录与封装','Model data and protect mutable state at object boundaries.','通过对象边界封装数据与可变状态。','Does a record containing a mutable list make the list immutable?','record 持有可变列表时，列表也会不可变吗？'],
      ['collections','Collections & equality','集合与相等性','Choose collections and implement consistent equality contracts.','选择集合并遵守相等性契约。','Why must equal objects have equal hash codes in a HashSet?','HashSet 中相等对象为什么必须有相同哈希值？'],
      ['exceptions','Exceptions & resource ownership','异常与资源管理','Propagate failures and close resources with try-with-resources.','传递异常并使用 try-with-resources 释放资源。','Who closes a resource when processing throws an exception?','处理过程中发生异常时，资源由谁关闭？'],
      ['generics','Generics & variance','泛型与型变','Use bounded generics and wildcards for type-safe APIs.','使用有界泛型和通配符建立类型安全接口。','Why can a List<Integer> not be assigned to List<Number>?','为什么 List<Integer> 不能赋给 List<Number>？'],
      ['streams','Lambdas, streams & collectors','Lambda、流与收集器','Transform data without hidden shared-state side effects.','避免隐式共享状态副作用，完成数据转换。','Why should stream transformations avoid mutating an external list?','流转换为什么应避免修改外部列表？'],
      ['testing','Testing & dependency boundaries','测试与依赖边界','Test observable behavior with injected clocks and repositories.','注入时钟与仓储，测试可观察行为。','How can expiry logic be tested without sleeping?','如何不等待真实时间就验证过期逻辑？'],
      ['http','HTTP & service boundaries','HTTP 与服务边界','Map validation, domain failures, and responses explicitly.','明确映射校验、领域错误与响应。','Should malformed input and a missing resource return the same result?','无效输入和资源不存在应该返回同一种结果吗？'],
      ['concurrency','Threads, virtual threads & shared state','线程、虚拟线程与共享状态','Separate task concurrency from shared-state synchronization.','区分任务并发与共享状态同步。','Do virtual threads make a shared counter increment atomic?','虚拟线程会让共享计数器自增自动具备原子性吗？'],
      ['async','Futures, timeouts & cancellation','Future、超时与取消','Compose asynchronous work and preserve failure boundaries.','组合异步任务并保留失败边界。','Does timing out a future guarantee its underlying work has stopped?','Future 超时是否保证底层任务已经停止？'],
      ['persistence','JDBC & transactions','JDBC 与事务','Use parameters and explicit transaction boundaries.','使用参数化查询与明确的事务边界。','How do you prevent a partially applied two-step update?','如何避免两步更新只成功一步？'],
      ['jvm','JVM memory & diagnostics','JVM 内存与诊断','Use allocation, reachability, and timing evidence to diagnose problems.','根据分配、可达性与耗时证据诊断问题。','Why can reachable objects still cause unbounded memory growth?','对象仍然可达时，为什么也会造成内存无限增长？']
    ],[['Build a validated task model.','建立经过校验的任务模型。'],['Build a testable service boundary.','构建可测试的服务边界。'],['Design a bounded concurrent service.','设计资源有界的并发服务。']])},
  {id:'python',name:{en:'Python',zh:'Python'},mark:'Py',category:'backend',mode:'topics',source:'https://docs.python.org/3/tutorial/',
    description:{en:'Write clear data transformations, testable tools, and asynchronous services.',zh:'编写清晰的数据转换、可测试工具与异步服务。'},
    prerequisite:{en:'Basic programming. Exercises use Python 3.12 and the standard library, without third-party packages.',zh:'具备基本编程知识。题目采用 Python 3.12 标准库，不依赖第三方包。'},
    stages:stages('python','https://docs.python.org/3/tutorial/',[
      ['values','Values, identity & mutability','值、身份与可变性','Distinguish equality, identity, and shared mutable references.','区分相等性、对象身份与共享可变引用。','Does copying a list also copy its nested dictionaries?','复制列表时，嵌套字典也会被复制吗？'],
      ['collections','Collections & comprehensions','集合与推导式','Choose lists, dictionaries, and sets for data transformations.','选择列表、字典与集合完成数据转换。','How would you deduplicate values while preserving their first-seen order?','如何去重并保留首次出现的顺序？'],
      ['functions','Functions, arguments & scope','函数、参数与作用域','Use explicit arguments and avoid shared mutable defaults.','明确设计函数参数，避免共享可变默认值。','Why can a default list retain data between function calls?','默认列表为什么可能保留上次调用的数据？'],
      ['exceptions','Exceptions & context managers','异常与上下文管理器','Release owned resources even when work fails.','任务失败时也能释放所属资源。','How does a with block behave when its body raises?','with 代码块内部抛异常时如何处理资源？'],
      ['modules','Modules & import boundaries','模块与导入边界','Separate reusable functions from entry-point side effects.','分离可复用函数与入口副作用。','Why put executable entry logic behind __name__ == "__main__"?','为什么入口逻辑要放到 __name__ == "__main__" 判断中？'],
      ['typing','Type hints & data models','类型提示与数据模型','Use annotations and dataclasses without assuming runtime validation.','使用类型提示和 dataclass，不把注解当运行时校验。','Does annotating a parameter as int reject strings at runtime?','把参数标成 int 会在运行时自动拒绝字符串吗？'],
      ['iteration','Iterators & generators','迭代器与生成器','Process data lazily and manage one-shot consumption.','惰性处理数据，注意一次性迭代。','What happens when you iterate over an exhausted generator again?','再次遍历已经耗尽的生成器会怎样？'],
      ['testing','Tests & injected dependencies','测试与依赖注入','Test success, edge cases, and failures with deterministic inputs.','用确定性输入验证成功、边界与失败。','How can a time-dependent function be tested without the real clock?','如何不依赖真实时钟测试时间相关函数？'],
      ['async','asyncio & cancellation','asyncio 与取消','Await work and clean up after task cancellation.','等待异步任务并在取消后清理资源。','Does calling an async function execute its body immediately?','调用 async 函数会立即执行其函数体吗？'],
      ['concurrency','Threads, processes & workloads','线程、进程与工作负载','Select concurrency using workload and runtime assumptions.','结合工作负载与运行环境选择并发方案。','Why can CPU-heavy work block an asyncio event loop?','CPU 密集任务为什么会阻塞 asyncio 事件循环？'],
      ['data','JSON, validation & persistence','JSON、校验与持久化','Validate external data and preserve transaction boundaries.','校验外部数据并维护事务边界。','Does successfully parsing JSON mean its fields satisfy your contract?','JSON 解析成功是否意味着字段满足业务契约？'],
      ['performance','Complexity, caching & profiling','复杂度、缓存与性能分析','Measure bottlenecks and bound cache ownership.','测量瓶颈并控制缓存生命周期。','Why can an unbounded cache retain objects indefinitely?','无界缓存为什么可能让对象始终无法释放？']
    ],[['Build a task-data transformation tool.','编写任务数据转换工具。'],['Package and test a small library.','组织并测试一个小型库。'],['Design a cancellable processing pipeline.','设计可取消的数据处理管道。']])},
  {id:'go',name:{en:'Go',zh:'Go'},mark:'Go',category:'backend',mode:'topics',source:'https://go.dev/doc/',
    description:{en:'Model explicit contracts and build testable, cancellable concurrent services.',zh:'建立明确契约，构建可测试、可取消的并发服务。'},
    prerequisite:{en:'Basic programming and HTTP. Exercises use Go 1.22, standard packages, and explicit concurrency assumptions.',zh:'具备基本编程与 HTTP 知识。题目采用 Go 1.22 标准库，并明确并发前提。'},
    stages:stages('go','https://go.dev/doc/',[
      ['values','Values, zero values & pointers','值、零值与指针','Distinguish copied values from shared referenced data.','区分值复制与共享引用数据。','Does copying a struct copy the storage referenced by its slice fields?','复制结构体会复制切片字段引用的底层存储吗？'],
      ['collections','Slices, maps & ownership','切片、映射与所有权','Handle shared backing arrays and nil collection behavior.','处理共享底层数组与 nil 集合行为。','Why can changing one subslice affect another slice?','修改一个子切片为什么可能影响另一个切片？'],
      ['functions','Functions, errors & defer','函数、错误与 defer','Return explicit errors and release resources in the owning scope.','显式返回错误并在所属作用域释放资源。','When are the arguments to a deferred call evaluated?','defer 调用的参数在什么时候求值？'],
      ['interfaces','Structs, methods & interfaces','结构体、方法与接口','Design small implicit interfaces and choose receiver semantics.','设计小型隐式接口并选择接收者语义。','Can an interface containing a typed nil pointer compare unequal to nil?','接口包含有类型的 nil 指针时，会不等于 nil 吗？'],
      ['modules','Packages & modules','包与模块','Separate public APIs from implementation and dependency setup.','分离公开接口、内部实现与依赖配置。','How do package exports differ from module dependency boundaries?','包的导出规则与模块依赖边界有什么不同？'],
      ['testing','Table-driven tests & fuzzing','表驱动测试与模糊测试','Test edge cases and invariants with deterministic fixtures.','用确定性数据验证边界与不变量。','Which invariant would catch a parser panic on unexpected input?','哪种不变量能帮助发现解析器遇到异常输入就崩溃？'],
      ['http','HTTP handlers & JSON','HTTP 处理器与 JSON','Validate bounded input and test handlers without listening on a port.','校验有界输入，不监听端口也能测试处理器。','Why should a handler return after writing an error response?','处理器写入错误响应后为什么应该 return？'],
      ['generics','Generics & constraints','泛型与约束','Write reusable functions using only operations allowed by constraints.','只使用约束允许的操作编写泛型函数。','Why must a generic map key satisfy comparable?','泛型映射的键为什么需要满足 comparable？'],
      ['goroutines','Goroutines & channels','Goroutine 与通道','Coordinate workers without leaks or ambiguous channel ownership.','明确通道所有权，避免协程泄漏。','What happens if a goroutine sends after the receiver has stopped?','接收方停止后，仍尝试发送的协程可能怎样？'],
      ['context','Context, deadlines & cancellation','Context、截止时间与取消','Propagate cancellation and make blocking operations observe it.','传递取消信号并让阻塞操作主动响应。','Does cancelling a context forcibly stop a goroutine?','取消 context 会强制停止 goroutine 吗？'],
      ['synchronization','Mutexes, races & ownership','锁、数据竞争与所有权','Protect shared invariants and avoid copying active mutexes.','保护共享不变量，避免复制已使用的互斥锁。','Why is protecting writes alone insufficient when reads happen concurrently?','并发读取时，为什么只保护写入还不够？'],
      ['services','Transactions & service diagnostics','事务与服务诊断','Define rollback paths and measure allocation and latency.','定义回滚路径并测量内存分配与延迟。','How do you ensure a failed second update does not leave the first committed?','如何确保第二次更新失败时，第一次不会单独提交？']
    ],[['Build a validated in-memory task model.','建立有校验的内存任务模型。'],['Design and test HTTP handler boundaries.','设计并测试 HTTP 处理边界。'],['Build a bounded cancellable worker design.','构建有界、可取消的 Worker 设计。']])}
];
