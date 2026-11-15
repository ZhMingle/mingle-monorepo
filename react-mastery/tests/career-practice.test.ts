import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {responseLesson} from './response-fixtures.ts';
import {validateResponseLesson,publicStudy} from '../shared/study.ts';
import type {StudyPayload} from '../shared/study.ts';
import {present,presentationStrings} from '../shared/presentation.ts';
import {performanceGuidance} from '../server/study-prompts.ts';
const scratch=mkdtempSync(join(tmpdir(),'clarity-career-test-'));process.env.DATA_DIR=scratch;
const {db}=await import('../server/store.ts');
const {studyAction,getStudy,studyProgress}=await import('../server/study.ts');
const {tutorReply}=await import('../server/tutor.ts');
after(()=>{db.close();for(const name of ['learning.sqlite','learning.sqlite-wal','learning.sqlite-shm'])rmSync(join(scratch,name),{force:true});rmdirSync(scratch);});
const generate=async<T>(prompt:string):Promise<T>=>{
  assert.match(prompt,/WRITTEN RESPONSE/);assert.match(prompt,/never programming/);assert.match(prompt,/true experience/);
  return structuredClone(responseLesson) as T;
};
async function create(){return (await studyAction('new',{topicId:'behavioral-interviews.ownership'},'en',generate) as StudyPayload).session.id;}

test('response generation protects answer keys, preserves a text draft and creates no execution contract',async()=>{
  const id=await create();const saved=getStudy(id);const payload=publicStudy(saved);
  assert.equal(saved.lesson.coding.format,'response');assert.equal(payload.session.lesson.coding.execution,undefined);
  assert.equal(payload.session.draft.code,responseLesson.coding.starter);
  assert.equal('fixtures' in payload.session.lesson.coding,false);assert.equal('rubric' in payload.session.lesson.coding,false);
  assert.deepEqual(payload.references,{});assert.deepEqual(payload.completed,[]);
  await studyAction('draft',{id,keywords:{},choice:-1,code:'我的真实经历，尚未提交。'},'zh');
  assert.equal(getStudy(id).draft.code,'我的真实经历，尚未提交。');
  assert.deepEqual(publicStudy(getStudy(id)).completed,[]);
});

test('behavioral responses use evidence-based answer review and fail incomplete answers without fabricating success',async()=>{
  const id=await create();const correct=responseLesson.coding.fixtures.correct;const incorrect=responseLesson.coding.fixtures.incorrect;
  const review=async<T>(prompt:string):Promise<T>=>{
    assert.match(prompt,/WRITTEN behavioral interview response/);assert.match(prompt,/Never grade grammar/);assert.match(prompt,/certify authenticity/);
    assert.doesNotMatch(prompt,/Review learner code/);
    const pass=prompt.includes(JSON.stringify(correct));
    return {quote:pass?'I asked each member':'We were great',feedback:pass?'Your actions and limits are clear.':'Name your own action and an observed result.',issues:pass?[]:['Personal action and a reliable outcome are missing.'],cases:[{id:'c1',passed:pass,reason:pass?'Names a personal action.':'No personal action.'},{id:'c2',passed:pass,reason:pass?'Acknowledges missing time data.':'Invents an unsupported percentage.'}]} as T;
  };
  const answer=(code:string)=>studyAction('answer',{id,kind:'code',keywords:{},choice:-1,code},'en',review);
  assert.deepEqual((await answer(incorrect) as StudyPayload).completed,[]);
  const passed=await answer(correct) as StudyPayload;assert.deepEqual(passed.completed,['code']);
  assert.equal(passed.session.attempts.at(-1)?.execution,undefined);
  const failed=await answer(incorrect) as StudyPayload;assert.deepEqual(failed.completed,['code']);
  assert.equal(failed.session.attempts.at(-1)?.accepted,false);
  assert.equal(studyProgress('behavioral-interviews').topics['behavioral-interviews.ownership'].total,2);
});

test('reference and coach help mark assistance without completing the response',async()=>{
  const id=await create();const payload=await studyAction('reference',{id,kind:'code'},'en') as StudyPayload;
  assert.equal(payload.references.code,responseLesson.coding.reference);assert.equal(payload.supported,true);
  assert.deepEqual(payload.completed,[]);
  const coach=async<T>(prompt:string):Promise<T>=>{
    assert.match(prompt,/behavioral interview coach/);assert.match(prompt,/Never invent the learner/);
    return {reply:'What did you personally do, and what happened next?'} as T;
  };
  await tutorReply({id,mode:'study',step:'code',message:'Help me choose a true example.',history:[]},'en',coach);
  assert.deepEqual(publicStudy(getStudy(id)).completed,[]);
});

test('behavioral choices use the saved key without AI and invalid review evidence preserves the response',async()=>{
  const id=await create();const code='I asked the team to confirm the missing owner.';
  const noAI=async<T>():Promise<T>=>{throw new Error('Choices must not call AI.');};
  const chosen=await studyAction('answer',{id,kind:'choice',keywords:{},choice:1,code},'en',noAI) as StudyPayload;
  assert.deepEqual(chosen.completed,['choice']);
  const badReview=async<T>():Promise<T>=>({quote:'invented evidence',feedback:'Looks good.',issues:[],cases:[{id:'c1',passed:true,reason:'Fine.'},{id:'c2',passed:true,reason:'Fine.'}]} as T);
  await assert.rejects(studyAction('answer',{id,kind:'code',keywords:{},choice:1,code},'en',badReview),/Invalid AI response feedback/);
  const saved=getStudy(id);assert.equal(saved.draft.code,code);assert.equal(saved.attempts.at(-1)?.accepted,false);
  assert.deepEqual(publicStudy(saved).completed,['choice']);
});

test('response translation covers authored scaffolds and references while preserving learner text and evidence',async()=>{
  const id=await create();await studyAction('reference',{id,kind:'code'},'en');
  const saved=getStudy(id);saved.draft.code='My own true answer stays unchanged.';
  saved.attempts=[{kind:'code',at:'2026-11-16',input:saved.draft.code,accepted:false,supported:false,review:{quote:'true answer',feedback:'Add one action.',issues:[],cases:[]}}];
  const payload=publicStudy(saved);const strings=presentationStrings(payload);
  assert.ok(strings.includes(responseLesson.coding.starter));assert.ok(strings.includes(responseLesson.coding.reference));
  assert.ok(strings.includes(responseLesson.coding.cases[1].input));assert.ok(!strings.includes(saved.draft.code));assert.ok(!strings.includes('true answer'));
  const translated=present(payload,Object.fromEntries(strings.map(s=>[s,'译文：'+s])));
  assert.match(translated.session.lesson.coding.starter,/^译文/);assert.match(translated.references.code!,/^译文/);
  assert.equal(translated.session.draft.code,saved.draft.code);assert.equal(translated.session.attempts[0].input,saved.draft.code);
  assert.equal(translated.session.attempts[0].review?.quote,'true answer');
});

test('behavioral lesson validation rejects code and executable contracts',()=>{
  assert.throws(()=>validateResponseLesson({...responseLesson,coding:{...responseLesson.coding,language:'JavaScript'}}),/Invalid response/);
  assert.throws(()=>validateResponseLesson({...responseLesson,choice:{...responseLesson.choice,code:'run()'}}),/Invalid response/);
  assert.throws(()=>validateResponseLesson({...responseLesson,coding:{...responseLesson.coding,execution:{} as never}}),/Invalid response/);
});

test('performance task guidance requires supplied evidence and bounded nonexecuting practice',()=>{
  for(const id of ['frontend-performance','backend-performance']){
    const prompt=performanceGuidance(id);assert.match(prompt,/Never invent benchmark results/);assert.match(prompt,/second transfer case/);assert.match(prompt,/real load tests/);
  }
  assert.equal(performanceGuidance('react'),'');
});
