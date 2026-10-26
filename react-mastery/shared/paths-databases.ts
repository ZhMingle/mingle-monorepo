import { pathStage } from './path-types.ts';
import type { LearningPath, PathId, TopicSpec } from './path-types.ts';

const engines = [
  {id:'mysql',name:'MySQL',mark:'MY',source:'https://dev.mysql.com/doc/refman/8.4/en/',index:'InnoDB clustered & secondary indexes',indexZh:'InnoDB 聚簇与二级索引',indexCheck:'Why does the primary-key size affect secondary indexes?',indexCheckZh:'主键大小为什么会影响二级索引？',special:'Replication & binary logs',specialZh:'复制与二进制日志',specialCheck:'Can a replica temporarily return older data than the primary?',specialCheckZh:'副本可能暂时读到比主库更旧的数据吗？',maintenance:'Slow queries & InnoDB diagnostics',maintenanceZh:'慢查询与 InnoDB 诊断',maintenanceCheck:'How would you separate a slow scan from a lock wait?',maintenanceCheckZh:'如何区分慢扫描和锁等待？'},
  {id:'sqlserver',name:'SQL Server',mark:'SQL',source:'https://learn.microsoft.com/en-us/sql/relational-databases/',index:'Clustered, nonclustered & INCLUDE',indexZh:'聚簇、非聚簇索引与 INCLUDE',indexCheck:'When can included columns avoid a key lookup?',indexCheckZh:'包含列何时能避免键查找？',special:'Parameter-sensitive query plans',specialZh:'参数与查询计划',specialCheck:'Why can the same parameterized query perform differently for different values?',specialCheckZh:'同一个参数化查询为何在不同参数下性能不同？',maintenance:'Query Store & wait diagnostics',maintenanceZh:'Query Store 与等待诊断',maintenanceCheck:'How would you investigate a query that became slower after a plan change?',maintenanceCheckZh:'查询更换计划后变慢，如何定位？'},
  {id:'postgresql',name:'PostgreSQL',mark:'PG',source:'https://www.postgresql.org/docs/current/',index:'B-tree, partial & expression indexes',indexZh:'B-tree、部分与表达式索引',indexCheck:'When can a partial index help, and when can a query not use it?',indexCheckZh:'部分索引何时有帮助，哪些查询可能无法使用它？',special:'JSONB & specialized indexes',specialZh:'JSONB 与专用索引',specialCheck:'When should frequently queried JSON fields become relational columns?',specialCheckZh:'频繁查询的 JSON 字段何时应改为关系型列？',maintenance:'MVCC, VACUUM & statistics',maintenanceZh:'MVCC、VACUUM 与统计信息',maintenanceCheck:'Why can updates leave dead tuples, and what does VACUUM do?',maintenanceCheckZh:'更新为何留下死元组，VACUUM 起什么作用？'}
] as const;

export const databasePaths:LearningPath[] = engines.map(engine => {
  const id:PathId = engine.id;
  const basics:TopicSpec[] = [
    ['model','Relational modeling & types','关系建模与数据类型','Model entities, relationships, and appropriate column types.','建模实体、关系，并选择合适列类型。','How would you model users with multiple roles without comma-separated values?','如何表示一个用户的多个角色，而不使用逗号分隔字段？'],
    ['constraints','Keys, constraints & NULL','键、约束与 NULL','Enforce integrity and use IS NULL deliberately.','通过约束保证完整性，并正确使用 IS NULL。','Why does column = NULL not select missing values?','为什么 column = NULL 不能筛选缺失值？'],
    ['joins','SELECT & joins','查询与连接','Reason about join cardinality and unmatched rows.','分析连接的行数与未匹配数据。','How can a WHERE filter accidentally turn a LEFT JOIN into an inner join?','WHERE 条件如何让 LEFT JOIN 意外变成内连接？'],
    ['aggregation','Aggregation & window functions','聚合与窗口函数','Choose GROUP BY or a window while preserving the intended rows.','根据结果粒度选择分组或窗口函数。','How would you get the latest order for each customer with deterministic ties?','如何确定性地获取每位客户的最新订单？']
  ];
  const practice:TopicSpec[] = [
    ['indexes',engine.index,engine.indexZh,'Connect index layout to query access paths and write costs.','将索引结构与查询路径、写入成本联系起来。',engine.indexCheck,engine.indexCheckZh],
    ['plans','Composite indexes & execution plans','复合索引与执行计划','Inspect estimates, filters, sorting, and actual work.','检查估算、过滤、排序和实际执行成本。','How would you choose index column order for equality, range, and sorting?','等值、范围与排序条件共存时，如何选择索引列顺序？'],
    ['transactions','Transactions & isolation','事务与隔离','Test concurrent sessions rather than assuming one isolation behavior.','使用并发会话验证行为，避免假设所有隔离级别一致。','Can a transaction read the same row twice and see different values? Under which configuration?','事务内两次读同一行可能不同吗？取决于哪些配置？'],
    ['concurrency','Locks, deadlocks & retries','锁、死锁与重试','Identify lock order and retry whole failed transactions safely.','识别加锁顺序，并安全重试失败事务。','Two transactions update rows in opposite order: how can you reduce deadlocks?','两个事务反向更新相同行，怎样减少死锁？']
  ];
  const advanced:TopicSpec[] = [
    ['engine-feature',engine.special,engine.specialZh,'Evaluate engine-specific behavior using realistic workloads.','用真实负载评估引擎特有行为。',engine.specialCheck,engine.specialCheckZh],
    ['maintenance',engine.maintenance,engine.maintenanceZh,'Diagnose performance using engine evidence and current statistics.','结合引擎证据与统计信息诊断性能。',engine.maintenanceCheck,engine.maintenanceCheckZh],
    ['recovery','Backup & recovery drills','备份与恢复演练','Define recovery targets and verify restoration in an isolated environment.','定义恢复目标，并在隔离环境验证恢复。','Why is a successful backup job insufficient proof that recovery works?','为什么备份任务成功还不能证明数据能够恢复？'],
    ['security','Security & schema changes','权限与结构迁移','Use parameterized SQL, least privilege, and staged migrations.','使用参数化 SQL、最小权限和分阶段迁移。','How would you add a required column to a large live table without breaking old clients?','如何为线上大表添加必填列，同时兼容旧客户端？']
  ];
  return {id,name:{en:engine.name,zh:engine.name},mark:engine.mark,category:'database',mode:'topics',source:engine.source,
    description:{en:`Model, query, and operate ${engine.name} with confidence.`,zh:`掌握 ${engine.name} 的建模、查询、并发与运维。`},
    prerequisite:{en:'Basic programming; no prior SQL required.',zh:'具备基本编程能力，无需已有 SQL 经验。'},stages:[
      pathStage(id,'foundation',{en:'Design an order schema and write reporting queries.',zh:'设计订单数据模型并编写报表查询。'},engine.source,basics),
      pathStage(id,'practice',{en:'Optimize a slow query and reproduce a concurrent-update conflict.',zh:'优化一个慢查询，并复现并发更新冲突。'},engine.source,practice),
      pathStage(id,'advanced',{en:'Run a recovery drill and document a safe schema rollout.',zh:'完成恢复演练，并设计安全的结构迁移。'},engine.source,advanced)
    ]};
});
