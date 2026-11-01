import { test,after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { present,presentationStrings } from '../shared/presentation.ts';
const scratch=mkdtempSync(join(tmpdir(),'clarity-translation-'));process.env.DATA_DIR=scratch;
const {translatePresentation}=await import('../server/presentation.ts');
const {db}=await import('../server/store.ts');
after(()=>{db.close();rmSync(scratch,{recursive:true,force:true});});

test('translation covers question prose, options, feedback and revealed explanations while preserving evidence and executable code',()=>{
  const original={session:{id:'s1',language:'en',draft:{code:'const x = 1;',choice:1,reason:'my words'},lesson:{overview:'Overview',example:'const x = 1;',choice:{question:'Question',options:['Yes','No','Maybe'],code:'x++'},coding:{starter:'TODO',requirements:['Return a copy'],cases:[{id:'c1',input:'{x:1}',expected:'A copy'}]}},attempts:[{input:'my code',reason:'my reasoning',explanation:'my explanation',accepted:true,review:{quote:'my code',feedback:'Good',issues:['Missing copy'],cases:[{id:'c1',passed:false,reason:'Mutates input'}]}}]},references:{choice:'Because it changes',code:'const x = 1;',try:'Reasoning reference'}};
  const strings=presentationStrings(original);
  for(const text of ['Question','Yes','No','Maybe','Return a copy','A copy','Good','Missing copy','Mutates input','Because it changes','Reasoning reference'])assert.ok(strings.includes(text));
  for(const text of ['my words','my code','my reasoning','my explanation','const x = 1;','TODO','x++','{x:1}','s1','c1'])assert.ok(!strings.includes(text),text);
  const view=present(original,Object.fromEntries(strings.map(s=>[s,`译:${s}`])));
  assert.equal(view.session.lesson.choice.options[1],'译:No');
  assert.deepEqual(view.session.draft,original.session.draft);
  assert.equal(view.session.attempts[0].review.quote,'my code');
  assert.equal(view.session.attempts[0].accepted,true);
  assert.equal(view.references.code,original.references.code);
  assert.equal(original.session.lesson.choice.question,'Question');
});

test('translations are validated, deduplicated during flight, and cached durably per target language',async()=>{
  let calls=0;
  const run=async<T>():Promise<T>=>{calls++;return {translations:['问题','选项']} as T;};
  const input={texts:['Question','Option'],language:'zh'};
  const [a,b]=await Promise.all([translatePresentation(input,run),translatePresentation(input,run)]);
  assert.deepEqual(a,{'Question':'问题','Option':'选项'});assert.deepEqual(a,b);assert.equal(calls,1);
  assert.deepEqual(await translatePresentation(input,run),a);assert.equal(calls,1);
  await translatePresentation({...input,language:'en'},run);assert.equal(calls,2);
  const bad=async<T>():Promise<T>=>({translations:['only one']} as T);
  await assert.rejects(translatePresentation({texts:['A','B'],language:'zh'},bad),/Invalid translation response/);
  await translatePresentation({texts:['A','B'],language:'zh'},run);assert.equal(calls,3);
  await assert.rejects(translatePresentation({texts:['A'],language:'xx'},run),/Invalid translation request/);
});
