import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {marketingPaths} from '../shared/paths-marketing.ts';
import {marketingLesson} from './marketing-fixtures.ts';
import type {StudyPayload} from '../shared/study.ts';
import {publicStudy} from '../shared/study.ts';
const scratch=mkdtempSync(join(tmpdir(),'clarity-marketing-test-'));process.env.DATA_DIR=scratch;
const {db}=await import('../server/store.ts');
const {studyAction,getStudy,studyProgress}=await import('../server/study.ts');
const {tutorReply}=await import('../server/tutor.ts');
after(()=>{db.close();for(const name of ['learning.sqlite','learning.sqlite-wal','learning.sqlite-shm'])rmSync(join(scratch,name),{force:true});rmdirSync(scratch);});
const generate=async<T>(prompt:string):Promise<T>=>{
  assert.match(prompt,/WRITTEN MARKETING CASE RESPONSE/);assert.match(prompt,/c2 changes ONE meaningful input/);assert.match(prompt,/fixtures.correct/);assert.match(prompt,/metric denominators/);
  return structuredClone(marketingLesson) as T;
};
async function create(topicId='marketing-fundamentals.roas') {return (await studyAction('new',{topicId},'en',generate) as StudyPayload).session.id;}

test('six marketing paths preserve all ten modules as 123 bilingual topics in the intended order',()=>{
  assert.deepEqual(marketingPaths.map(path=>[path.id,path.stages.reduce((n,s)=>n+s.topics.length,0)]),[['marketing-fundamentals',19],['google-ads',15],['seo',44],['marketing-analytics',24],['ecommerce-marketing',10],['ai-search-reporting',11]]);
  for(const path of marketingPaths){assert.equal(path.category,'marketing');assert.equal(path.practiceMode,'response');}
  const ids=new Set(marketingPaths.flatMap(p=>p.stages.flatMap(s=>s.topics.map(t=>t.id))));
  for(const id of ['marketing-fundamentals.sem','marketing-fundamentals.ltv','google-ads.merchant-center','seo.ssr-csr','seo.gsc-troubleshooting','seo.semrush','seo.lighthouse','marketing-analytics.key-events','marketing-analytics.consent','marketing-analytics.server-side','ecommerce-marketing.ab-testing','ai-search-reporting.geo','ai-search-reporting.strategy'])assert.ok(ids.has(id));
  assert.equal(1000/200,5);assert.equal(1000*0.30-200,100);assert.equal(1000*0.15-200,-50);
});

test('every marketing path enters plain text practice without exposing hidden assessment material',async()=>{
  for(const path of marketingPaths){
    const id=await create(path.stages[0].topics[0].id);const saved=getStudy(id);const payload=publicStudy(saved);
    assert.equal(saved.lesson.coding.format,'response');assert.equal(payload.session.lesson.coding.execution,undefined);
    assert.equal(payload.session.draft.code,marketingLesson.coding.starter);
    assert.equal('fixtures' in payload.session.lesson.coding,false);assert.equal('rubric' in payload.session.lesson.coding,false);
    assert.equal('correct' in payload.session.lesson.choice,false);assert.deepEqual(payload.references,{});
    assert.deepEqual(payload.completed,[]);
  }
});

test('case review rejects the incorrect fixture and incomplete transfer, while choices use the saved key',async()=>{
  const id=await create();const partial='ROAS is 5x and initial contribution is NZD 100. I have not addressed the changed margin.';
  const review=async<T>(prompt:string):Promise<T>=>{
    assert.match(prompt,/WRITTEN MARKETING CASE RESPONSE/);assert.match(prompt,/Check both cases separately/);assert.doesNotMatch(prompt,/WRITTEN behavioral interview response|Review learner code/);
    const correct=prompt.includes(JSON.stringify(marketingLesson.coding.fixtures.correct));const incomplete=prompt.includes(JSON.stringify(partial));
    return {quote:correct||incomplete?'ROAS is 5x':'profit is NZD 800',feedback:correct?'Both calculations and the changed decision are supported.':'Review contribution after advertising and the changed margin.',issues:correct?[]:['Contribution or transfer evidence is missing.'],cases:[{id:'c1',passed:correct||incomplete,reason:'Primary calculation reviewed.'},{id:'c2',passed:correct,reason:correct?'Changed margin yields minus NZD 50.':'Changed-margin reasoning is incomplete or incorrect.'}]} as T;
  };
  const answer=(code:string)=>studyAction('answer',{id,kind:'code',keywords:{},choice:0,code},'en',review);
  assert.deepEqual((await answer(marketingLesson.coding.fixtures.incorrect) as StudyPayload).completed,[]);
  assert.deepEqual((await answer(partial) as StudyPayload).completed,[]);
  const passed=await answer(marketingLesson.coding.fixtures.correct) as StudyPayload;assert.deepEqual(passed.completed,['code']);
  assert.equal(passed.session.attempts.at(-1)?.execution,undefined);
  const noAI=async<T>():Promise<T>=>{throw Error('A choice must not call AI.');};
  const choice=await studyAction('answer',{id,kind:'choice',keywords:{},choice:0,code:marketingLesson.coding.fixtures.correct},'en',noAI) as StudyPayload;
  assert.deepEqual(choice.completed,['choice','code']);assert.equal(studyProgress('marketing-fundamentals').topics['marketing-fundamentals.roas'].completed,2);
});

test('marketing tutor and reference assistance preserve drafts and do not complete practice',async()=>{
  const id=await create();const code='我的计算尚未完成，请保留这份草稿。';
  await studyAction('draft',{id,keywords:{},choice:-1,code},'zh');
  await tutorReply({id,mode:'study',step:'code',message:'Explain the margin change.',history:[]},'zh',async<T>(prompt:string):Promise<T>=>{
    assert.match(prompt,/Search Marketing tutor/);assert.match(prompt,/Do not request a personal interview story/);return {reply:'先计算 15% 毛利，再减去广告支出。'} as T;
  });
  const payload=await studyAction('reference',{id,kind:'code'},'en') as StudyPayload;
  assert.equal(payload.references.code,marketingLesson.coding.reference);assert.equal(payload.supported,true);assert.deepEqual(payload.completed,[]);assert.equal(getStudy(id).draft.code,code);
});

test('connection failures retain marketing answers without fabricated feedback',async()=>{
  const id=await create();const code='ROAS is 5x; I am still calculating the changed margin.';
  const unavailable=async<T>():Promise<T>=>{throw Error('Connection failed');};
  await assert.rejects(studyAction('answer',{id,kind:'code',keywords:{},choice:-1,code},'en',unavailable),/Connection failed/);
  const saved=getStudy(id);assert.equal(saved.draft.code,code);assert.equal(saved.attempts.at(-1)?.accepted,false);assert.equal(saved.attempts.at(-1)?.review,undefined);assert.deepEqual(publicStudy(saved).completed,[]);
});
