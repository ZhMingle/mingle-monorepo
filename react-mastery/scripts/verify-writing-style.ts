// Real AI wording smoke check, isolated from learner records and production caches.
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {present,presentationStrings} from '../shared/presentation.ts';

const scratch=mkdtempSync(join(tmpdir(),'clarity-writing-'));
process.env.DATA_DIR=scratch;
const {translatePresentation}=await import('../server/presentation.ts');
const {db}=await import('../server/store.ts');
try{
  const question={question:'哪个索引把用于查找指定租户的字段放在第一列，并让后面的字段顺序直接符合查询要求的排序？'};
  const rewritten=present(question,await translatePresentation({texts:presentationStrings(question),language:'zh'}));
  assert.notEqual(rewritten.question,question.question);
  assert.ok(rewritten.question.includes('第一列'));
  assert.ok(!rewritten.question.includes('字段顺序直接符合'));
  console.log(JSON.stringify(rewritten,null,2));
  if(!process.argv.includes('--question-only')){
  const lesson={
    overview:'B-tree 按顺序组织索引键，能帮助查询找到相等值、范围内的值，并按所需顺序读取。部分索引只记录满足条件的行；表达式索引记录计算结果。相关数据写入时，也需要维护索引。',
    exampleExplanation:'查询明确要求 `done = false`，所以符合查询条件的行都在这个部分索引中。B-tree 可以从日期边界开始按时间读取；实际是否使用这个索引，还取决于数据量和成本估算。',
    pitfall:'把部分索引的条件改成参数后，查询可能用不上这个索引。例如，索引条件是 `done = false`，通用计划中的 `done = $1` 无法保证满足这个条件，即使这次传入的是 `false`。',
    example:'CREATE INDEX tasks_open_created_idx ON tasks (created_at) WHERE done = false;',
  };
  const translations=await translatePresentation({texts:presentationStrings(lesson),language:'zh'});
  const result=present(lesson,translations);
  assert.equal(result.example,lesson.example);
  assert.notEqual(result.overview,lesson.overview);
  assert.ok(result.pitfall.includes('`done = $1`'));
  console.log(JSON.stringify(result,null,2));
  const planLesson={
    overview:'复合 B-tree 索引通常先放用于等值匹配的列，也就是要求值相等的列，再考虑范围条件和排序用到的列。\n\n读执行计划时，要分清数据库预计返回多少行、实际返回多少行、过滤掉多少行，以及排序做了多少工作。本课讨论 PostgreSQL 17 的行为。',
    example:'这条查询要找出某个用户最近的记录。索引可以先按用户分组，再把每个用户的记录按时间排好。\n\n```sql\nCREATE INDEX events_user_time_idx\nON events (user_id, occurred_at DESC);\n\nEXPLAIN (ANALYZE, BUFFERS)\nSELECT occurred_at\nFROM events\nWHERE user_id = 7\nORDER BY occurred_at DESC\nLIMIT 5;\n```\n\n先看 `Index Cond` 是否限定了用户，再看有没有 `Sort`，然后比较预计的 `rows` 和 `actual rows`。\n\n`actual rows` 和时间通常是每次循环的平均值，要结合 `loops` 才能判断总共做了多少工作。`ANALYZE` 会实际执行查询。',
  };
  const planResult=present(planLesson,await translatePresentation({texts:presentationStrings(planLesson),language:'zh'}));
  assert.notEqual(planResult.overview,planLesson.overview);
  assert.equal(planResult.example.match(/```sql[\s\S]*?```/)?.[0],planLesson.example.match(/```sql[\s\S]*?```/)?.[0]);
  console.log(JSON.stringify(planResult,null,2));
  }
}finally{
  db.close();rmSync(scratch,{recursive:true,force:true});
}
