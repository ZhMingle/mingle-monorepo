import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {authoredImportance,validateImportance} from '../shared/topic-importance.ts';
const scratch=mkdtempSync(join(tmpdir(),'clarity-importance-'));process.env.DATA_DIR=scratch;
const {topicImportance}=await import('../server/topic-importance.ts');
const {db}=await import('../server/store.ts');
after(()=>{db.close();rmSync(scratch,{recursive:true,force:true});});
test('CSS fundamentals and common SQL topics have stable five-star ratings in both languages',async()=>{
  for(const id of ['html-css.box-model','html-css.flexbox','html-css.grid',...['mysql','postgresql','sqlserver'].flatMap(path=>['joins','constraints','transactions','indexes','aggregation'].map(key=>`${path}.${key}`))]){
    for(const language of ['zh','en'] as const){
      const result=await topicImportance({topicId:id,language},async()=>{throw Error('Authored ratings must not call AI');});
      assert.equal(result.stars,5,id);assert.ok(result.why);assert.equal(result.uses.length,2);
    }
  }
  assert.equal(authoredImportance('postgresql.plans','zh')?.stars,4);
});
test('other topics deduplicate and persist AI context-specific importance separately by language',async()=>{
  let calls=0;const expected={stars:4,why:'知道代码会接受哪种数据，能更早发现传错参数。',uses:['给接口参数标注类型。','排查字符串和数字混用的问题。']};
  const run=async<T>()=>{calls++;return expected as T;};
  const input={topicId:'typescript.inference',language:'zh'};
  const [a,b]=await Promise.all([topicImportance(input,run),topicImportance(input,run)]);
  assert.deepEqual(a,b);assert.equal(calls,1);
  await topicImportance(input,run);assert.equal(calls,1);
  await topicImportance({...input,language:'en'},run);assert.equal(calls,2);
  await assert.rejects(topicImportance({topicId:'unknown.fake',language:'zh'},run),/Unknown topic/);
  await assert.rejects(topicImportance({...input,language:'bad'},run),/Invalid/);
});
test('failed or malformed AI results are not cached as ratings and can retry',async()=>{
  const input={topicId:'typescript.unions',language:'zh'};
  await assert.rejects(topicImportance(input,async()=>{throw Error('Offline');}),/Offline/);
  await assert.rejects(topicImportance(input,async<T>()=>({stars:6,why:'bad',uses:[]}) as T),/Invalid/);
  assert.throws(()=>validateImportance({stars:4,why:'',uses:['example']}),/Invalid/);
  const result=await topicImportance(input,async<T>()=>({stars:5,why:'同一个输入可能有不同类型，需要先判断再使用。',uses:['处理接口返回的不同结果。','检查输入框里的数据。']}) as T);
  assert.equal(result.stars,5);
});
