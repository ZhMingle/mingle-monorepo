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
}finally{
  db.close();rmSync(scratch,{recursive:true,force:true});
}
