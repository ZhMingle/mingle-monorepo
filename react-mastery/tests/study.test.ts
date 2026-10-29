import { test,after } from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {aliasMatches,completedKinds,publicStudy,validateBlankResults,validateCodeReview,validateStudyLesson} from '../shared/study.ts';
import type {StudyLesson,StudyPayload} from '../shared/study.ts';
const scratch=mkdtempSync(join(tmpdir(),'clarity-study-test-'));process.env.DATA_DIR=scratch;
const {db,exportData}=await import('../server/store.ts');
const {studyAction,getStudy,saveStudy,studyProgress}=await import('../server/study.ts');
after(()=>{db.close();for(const name of ['learning.sqlite','learning.sqlite-wal','learning.sqlite-shm'])rmSync(join(scratch,name),{force:true});rmdirSync(scratch);});
const lesson:StudyLesson={overview:'Repeat-safe updates can set a value without mutating the input.',example:'const done = {...item, done: true};',pitfall:'Incrementing is not the same as setting.',keywords:[
  {id:'k1',prompt:'Repeating a request has no further effect: it is ____.',answer:'idempotent',aliases:[],explanation:'Repeating it has the same effect as applying it once.'},
  {id:'k2',prompt:'Keep the original object unchanged; use an ____ update.',answer:'immutable',aliases:['immutability'],explanation:'Return a new object without changing the old one.'}
],choice:{scenario:'A counter starts at zero.',code:'n += 1;',question:'Is repeating this operation idempotent?',options:['Yes','No','Only on Tuesdays'],correct:1,explanation:'No: repeating increments changes the result.'},coding:{scenario:'Implement markDone(item).',language:'JavaScript',starter:'function markDone(item) { /* TODO */ }',requirements:['Return a new object with done true','Keep other fields and leave input unchanged'],reference:'function markDone(item) { return {...item, done: true}; }',rubric:['Copies the input','Sets done true without mutation'],cases:[{id:'c1',input:'{id: 1, done: false}',expected:'A new {id: 1, done: true}; original unchanged'},{id:'c2',input:'{id: 2, done: true}',expected:'A new {id: 2, done: true}; original unchanged'}],fixtures:{correct:'function markDone(item) { return {...item, done: true}; }',incorrect:'function markDone(item) { item.done = true; return item; }'}}};
const generate=async<T>():Promise<T>=>structuredClone(lesson) as T;
async function create(topicId='typescript.inference'){return (await studyAction('new',{topicId},'en',generate) as StudyPayload).session.id;}
async function legacyCreate(){const id=await create();const s=getStudy(id);s.version='mixed-practice-v1';s.current='keywords';s.lesson.keywords=structuredClone(lesson.keywords);saveStudy(s);return id;}
const draft={keywords:{k1:'idempotency',k2:'immutability'},choice:1,code:lesson.coding.fixtures.correct};

test('keyword aliases accept meaning and word forms without matching opposite concepts',()=>{
  for(const word of ['IDEMPOTENT','idempotence','idempotency',' Idempotency. '])assert.ok(aliasMatches(lesson.keywords[0],word));
  for(const word of ['not idempotent','non-idempotent','idempotent or not','mutable','幂等'])assert.equal(aliasMatches(lesson.keywords[0],word),false);
  assert.equal(aliasMatches(lesson.keywords[1],'mutable'),false);assert.equal(aliasMatches(lesson.keywords[1],'immutability'),true);
});
test('React and every new path can generate only choice and code formats without altering old records',async()=>{
  for(const topicId of ['react.props','typescript.inference','html-css.semantics','dotnet.types','nodejs.runtime','java.types','python.values','go.values','mysql.model','sqlserver.model','postgresql.model']){
    const id=await create(topicId);const s=getStudy(id);assert.equal(s.topicId,topicId);assert.equal(s.draft.code,s.lesson.coding.starter);assert.equal(s.current,'choice');assert.deepEqual(s.lesson.keywords,[]);
    assert.equal((await studyAction('latest',{topicId},'zh') as StudyPayload).session.id,id);
  }
  await assert.rejects(studyAction('new',{topicId:'unknown'},'en',generate),/Unknown topic/);
});
test('all idempotent word forms pass locally without an AI call or a long explanation',async()=>{
  const id=await legacyCreate();let calls=0;
  for(const word of ['idempotent','idempotence','idempotency']){
    const result=await studyAction('answer',{id,kind:'keywords',...draft,keywords:{...draft.keywords,k1:word}},'en',async<T>()=>{calls++;return {} as T;}) as StudyPayload;
    assert.equal(result.session.attempts.at(-1)?.accepted,true);
  }
  assert.equal(calls,0);assert.deepEqual(completedKinds(getStudy(id)),[]);
  assert.equal(publicStudy(getStudy(id)).supported,false);
});
test('unfamiliar synonyms use semantic evaluation; a mismatch does not pass',async()=>{
  const id=await legacyCreate();let calls=0;
  await studyAction('answer',{id,kind:'keywords',...draft,keywords:{k1:'repeat safe',k2:'immutable'}},'zh',async<T>()=>{calls++;return {results:[{id:'k1',accepted:true,feedback:'The same concept.'}]} as T;});
  assert.equal(calls,1);assert.equal(getStudy(id).attempts.at(-1)?.accepted,true);
  await studyAction('answer',{id,kind:'keywords',...draft,keywords:{k1:'not idempotent',k2:'immutable'}},'zh',async<T>()=>({results:[{id:'k1',accepted:false,feedback:'The negation reverses the meaning.'}]} as T));
  assert.equal(getStudy(id).attempts.at(-1)?.accepted,false);
  await assert.rejects(studyAction('answer',{id,kind:'keywords',...draft,keywords:{k1:'幂等',k2:'immutable'}},'zh',generate),/English technical term/);
});
test('choices need no written rationale, coding accepts equivalent implementations, and progress stays distinct from mastery',async()=>{
  const id=await create();await studyAction('answer',{id,kind:'choice',...draft},'en');
  assert.equal(getStudy(id).attempts.at(-1)?.accepted,true);
  const code='function markDone(item) { return Object.assign({}, item, {done: true}); }';
  await studyAction('answer',{id,kind:'code',...draft,code},'en',async<T>()=>({quote:'Object.assign',feedback:'Copies without mutation.',issues:[],cases:[{id:'c1',passed:true,reason:'Returns the changed copy.'},{id:'c2',passed:true,reason:'Still returns a new object.'}]} as T));
  assert.equal(getStudy(id).attempts.at(-1)?.accepted,true);
  assert.equal(studyProgress('typescript').topics['typescript.inference']?.completed,2);
  assert.equal('mastered' in publicStudy(getStudy(id)),false);
});
test('answers and fixtures stay private, references record support without replacing drafts, and exports include sessions',async()=>{
  const id=await create();await studyAction('draft',{id,...draft},'en');await studyAction('step',{id,kind:'code'},'en');
  const before=publicStudy(getStudy(id));assert.deepEqual(before.session.lesson.keywords,[]);assert.equal('correct' in before.session.lesson.choice,false);assert.equal('fixtures' in before.session.lesson.coding,false);assert.deepEqual(before.references,{});
  const result=await studyAction('reference',{id,kind:'code'},'en') as StudyPayload;assert.equal(result.supported,true);assert.equal(result.references.code,lesson.coding.reference);assert.equal(result.session.draft.code,draft.code);assert.equal(result.session.current,'code');
  assert.ok(exportData().studySessions.some(s=>s.id===id));
});
test('model failures and concurrent submissions preserve drafts without inventing a grade',async()=>{
  const id=await create();await assert.rejects(studyAction('answer',{id,kind:'code',...draft},'en',async()=>{throw new Error('Connection failed');}),/Connection failed/);
  assert.equal(getStudy(id).draft.code,draft.code);assert.equal(getStudy(id).attempts.at(-1)?.accepted,false);
  let release:()=>void=()=>{};const wait=new Promise<void>(resolve=>{release=resolve;});
  const pending=studyAction('answer',{id,kind:'code',...draft},'en',async<T>()=>{await wait;throw new Error('Connection failed again');});
  await assert.rejects(studyAction('reference',{id,kind:'code'},'en'),/being checked/);release();await assert.rejects(pending,/Connection failed again/);
});
test('reject malformed generated tasks, fabricated evidence and missing/duplicate feedback ids',()=>{
  assert.doesNotThrow(()=>validateStudyLesson(lesson));const bad=structuredClone(lesson);bad.keywords[0].answer='幂等';assert.throws(()=>validateStudyLesson(bad),/keyword exercise/);
  assert.throws(()=>validateBlankResults({results:[{id:'wrong',accepted:true,feedback:'yes'}]},['k1']),/Incomplete/);
  assert.throws(()=>validateCodeReview({quote:'fabricated',feedback:'yes',issues:[],cases:[]},draft.code,['c1','c2']),/Invalid AI/);
});

test('React code requires a matching actual-run report and recomputes pass status',async()=>{
  const id=await create('react.props');const s=getStudy(id);const code=s.lesson.coding.reference;let calls=0;
  const {testNames}=await import('../shared/test-spec.ts');
  const execution={runId:'test-run',code,passed:true,tests:testNames.props.map(name=>({name,passed:true,detail:'Passed'}))};
  const noAI=async<T>():Promise<T>=>{calls++;throw Error('Should not assess browser results with AI');};
  const result=await studyAction('answer',{id,kind:'code',...draft,code,execution},'en',noAI) as StudyPayload;assert.equal(result.session.attempts.at(-1)?.accepted,true);assert.equal(calls,0);
  execution.tests[0].passed=false;await studyAction('answer',{id,kind:'code',...draft,code,execution},'en',noAI);assert.equal(getStudy(id).attempts.at(-1)?.accepted,false);
  await assert.rejects(studyAction('answer',{id,kind:'code',...draft,code:code+'changed',execution},'en',noAI),/current code/);
});
test('old keyword history cannot block or inflate the two-format progress',async()=>{
  const id=await legacyCreate();const s=getStudy(id);s.helped=['keywords'];s.attempts=[{kind:'keywords',at:new Date().toISOString(),input:'idempotent',accepted:true,supported:true}];saveStudy(s);
  const p=publicStudy(s);assert.equal(p.session.current,'choice');assert.deepEqual(p.completed,[]);assert.equal(p.supported,false);assert.deepEqual(p.references,{});
  const fresh=await create();await assert.rejects(studyAction('step',{id:fresh,kind:'keywords'},'en'),/Unknown exercise/);
});
test('starting a fresh variation keeps earlier route progress and drafts can be saved before moving on',async()=>{
  const id=await create();await studyAction('answer',{id,kind:'choice',...draft},'en');
  const before=studyProgress('typescript').topics['typescript.inference'].completed;
  await create();assert.equal(studyProgress('typescript').topics['typescript.inference'].completed,before);
  await studyAction('draft',{id,...draft,code:'// my unsent draft'},'en');
  assert.equal(getStudy(id).draft.code,'// my unsent draft');
});
