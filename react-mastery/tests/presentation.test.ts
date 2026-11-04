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

test('SQL choices and inline code remain unchanged while surrounding prose is translated',()=>{
  const sql='CREATE TABLE user_roles (user_id INT UNSIGNED, role_id INT UNSIGNED, PRIMARY KEY (user_id, role_id));';
  const option='Create the join table:\n```sql\n'+sql+'\n```\nKeep `user_id` unchanged.';
  const payload={choice:{options:[option,sql,'Use `PRIMARY KEY (user_id)` here.']}};
  const strings=presentationStrings(payload);
  assert.deepEqual(strings,['Create the join table:\n⟦CLARITY_CODE_0⟧\nKeep ⟦CLARITY_CODE_1⟧ unchanged.','Use ⟦CLARITY_CODE_0⟧ here.']);
  const translations=Object.fromEntries(strings.map(s=>[s,'译:'+s]));
  translations[sql]='不应替换';translations.user_id='用户编号';
  const view=present(payload,translations);
  assert.equal(view.choice.options[0],'译:Create the join table:\n```sql\n'+sql+'\n```\nKeep `user_id` unchanged.');
  assert.equal(view.choice.options[1],sql);
  assert.equal(view.choice.options[2],'译:Use `PRIMARY KEY (user_id)` here.');
  assert.equal(payload.choice.options[0],option);
});

test('complete UI test actions are translated together while code remains exact',async()=>{
  const option='Render with `initialName="Ada"`, change the input to `Lin`, and assert the preview reads `Lin`.';
  const original={choice:{options:[option]}};const texts=presentationStrings(original);
  assert.deepEqual(texts,['Render with ⟦CLARITY_CODE_0⟧, change the input to ⟦CLARITY_CODE_1⟧, and assert the preview reads ⟦CLARITY_CODE_2⟧.']);
  const result=await translatePresentation({texts,language:'zh'},async<T>()=>({translations:['以 ⟦CLARITY_CODE_0⟧ 渲染组件，将输入框内容改为 ⟦CLARITY_CODE_1⟧，检查预览是否显示 ⟦CLARITY_CODE_2⟧。']}) as T);
  assert.equal(present(original,result).choice.options[0],'以 `initialName="Ada"` 渲染组件，将输入框内容改为 `Lin`，检查预览是否显示 `Lin`。');
  assert.equal(original.choice.options[0],option);
  const bad={...original,choice:{options:[option+' Another case.']}};const badTexts=presentationStrings(bad);
  await assert.rejects(translatePresentation({texts:badTexts,language:'zh'},async<T>()=>({translations:['丢失代码的翻译']}) as T),/protected code reference/);
  assert.deepEqual(present(bad,{[badTexts[0]]:'丢失代码的翻译'}),bad);
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
