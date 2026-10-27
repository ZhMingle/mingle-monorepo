import {pathStage} from './path-types.ts';
import type {LearningPath} from './path-types.ts';
const source='https://nodejs.org/api/';
export const nodePaths:LearningPath[]=[{
  id:'nodejs',name:{en:'Node.js',zh:'Node.js'},mark:'N',category:'backend',mode:'topics',source,
  description:{en:'Understand the runtime, build reliable services, and diagnose asynchronous workloads.',zh:'理解运行机制，构建可靠服务，诊断异步与性能问题。'},
  prerequisite:{en:'JavaScript functions, objects, Promises, and basic HTTP. Exercises assume Node.js 24 unless stated otherwise.',zh:'具备 JavaScript 函数、对象、Promise 与基本 HTTP 知识；题目默认使用 Node.js 24，特殊假设会单独说明。'},
  stages:[
    pathStage('nodejs','foundation',{en:'Build a small command-line utility with validated configuration and asynchronous input.',zh:'编写具备配置校验和异步输入处理的小型命令行工具。'},source,[
      ['runtime','Runtime, packages & configuration','运行环境、包与配置','Distinguish Node globals from browser APIs and validate environment configuration.','区分 Node 与浏览器 API，并校验环境配置。','An environment variable contains "false": why is Boolean(value) not a valid boolean parser?','环境变量值为 "false" 时，为什么不能直接用 Boolean(value) 解析？','https://nodejs.org/api/process.html'],
      ['modules','ES modules & CommonJS','ESM 与 CommonJS 模块','Choose module boundaries deliberately and understand exports, loading, and caching.','合理选择模块边界，理解导出、加载与缓存。','How do package.json type, .mjs, and .cjs affect how a file is interpreted?','package.json 的 type、.mjs 与 .cjs 如何影响模块解释方式？','https://nodejs.org/api/packages.html'],
      ['async-errors','Promises & asynchronous errors','Promise 与异步错误','Await asynchronous work and propagate rejection through the correct boundary.','正确等待异步任务，并将拒绝传递到正确的错误边界。','Why can try/catch miss the rejection of a Promise returned without await?','没有 await 的 Promise 拒绝，为什么可能绕过当前 try/catch？','https://nodejs.org/api/errors.html'],
      ['file-data','Files, paths & buffers','文件、路径与 Buffer','Handle asynchronous file data, encodings, and path resolution without blocking a request.','处理异步文件数据、编码与路径解析，避免阻塞请求。','How does resolving a relative path from the working directory differ from resolving it from the module location?','相对路径从工作目录解析，与从模块所在位置解析，有什么不同？','https://nodejs.org/api/fs.html']
    ]),
    pathStage('nodejs','practice',{en:'Design and test a small HTTP service with explicit error and resource boundaries.',zh:'设计并测试一个具有明确错误与资源边界的小型 HTTP 服务。'},source,[
      ['event-loop','Event loop & scheduling','事件循环与任务调度','Reason about asynchronous scheduling while specifying callback and module context.','明确回调与模块上下文，再推导异步调度顺序。','Why is it unsafe to promise a universal order between top-level setTimeout(0) and setImmediate?','为什么不能断言顶层 setTimeout(0) 与 setImmediate 总有固定顺序？','https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick'],
      ['http','HTTP request handling','HTTP 请求处理','Handle methods, paths, status codes, and bounded request bodies.','处理方法、路径、状态码与有大小限制的请求体。','Why must a request handler stop its control flow after sending the final response?','发送最终响应后，为什么要结束当前处理分支？','https://nodejs.org/api/http.html'],
      ['events','EventEmitter & cleanup','事件机制与监听清理','Manage listener ownership and distinguish synchronous events from asynchronous work.','管理监听器生命周期，区分同步事件派发与异步任务。','If an async listener rejects, what error-handling assumption could leave the failure unobserved?','异步监听器拒绝时，哪种错误处理假设可能使失败无人接管？','https://nodejs.org/api/events.html'],
      ['testing','node:test & dependency boundaries','node:test 与依赖边界','Test success and failure with injected dependencies instead of real services.','通过依赖注入验证成功与失败，减少对真实服务的依赖。','How can a test finish successfully before an unawaited assertion in an async callback runs?','没有等待异步回调时，为什么测试可能在断言执行前就显示成功？','https://nodejs.org/api/test.html']
    ]),
    pathStage('nodejs','advanced',{en:'Make a data-processing service bounded, cancellable, and observable.',zh:'让数据处理服务具备流量边界、取消能力与可观测性。'},source,[
      ['streams','Streams & backpressure','流与背压','Respect writable backpressure and propagate pipeline failures.','遵守可写流的背压信号，并传递管道错误。','What happens to memory if a producer keeps writing after write() returns false?','write() 返回 false 后仍持续写入，可能如何影响内存？','https://nodejs.org/api/stream.html'],
      ['workers','Concurrency & worker threads','并发控制与 Worker 线程','Bound concurrent I/O and move suitable CPU work off the main event loop.','限制并发 I/O，将合适的 CPU 密集工作移出主事件循环。','Why does wrapping a CPU-heavy loop in an async function not make it non-blocking?','为什么给 CPU 密集循环套上 async 函数，并不会让它不阻塞？','https://nodejs.org/api/worker_threads.html'],
      ['cancellation','Cancellation, timeouts & cleanup','取消、超时与资源清理','Propagate AbortSignal and release resources on success, failure, and cancellation.','传递 AbortSignal，并在成功、失败、取消时释放资源。','Does rejecting a timeout Promise automatically stop the underlying operation?','超时 Promise 被拒绝后，底层任务就一定停止了吗？','https://nodejs.org/api/globals.html#class-abortcontroller'],
      ['diagnostics','Performance & production diagnostics','性能与生产诊断','Use timing, event-loop delay, and memory evidence to locate bottlenecks.','结合耗时、事件循环延迟与内存证据定位瓶颈。','How would you distinguish blocked event-loop time from waiting on a slow dependency?','如何区分事件循环被阻塞，与等待慢依赖造成的延迟？','https://nodejs.org/api/perf_hooks.html']
    ])
  ]
}];
