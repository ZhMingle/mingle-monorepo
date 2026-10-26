import { test,after } from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import { publicTopic, topicStatus, validateTopicLesson, validateTopicReview } from '../shared/topic-practice.ts';
import type {TopicLesson,TopicPayload,TopicReview} from '../shared/topic-practice.ts';
const scratch=mkdtempSync(join(tmpdir(),'clarity-topic-test-'));process.env.DATA_DIR=scratch;
const {db,exportData}=await import('../server/store.ts');
const {topicAction,getTopic,topicProgress}=await import('../server/topic-practice.ts');
after(()=>{db.close();for(const name of ['learning.sqlite','learning.sqlite-wal','learning.sqlite-shm'])rmSync(join(scratch,name),{force:true});rmdirSync(scratch);});
const lesson:TopicLesson={overview:'A const binding cannot be reassigned; object properties can still change.',example:'const item = { count: 1 }; item.count = 2;',exampleExplanation:'The binding still refers to the same object.',pitfall:'const does not imply deep immutability.',tasks:{
  try:{scenario:'TypeScript strict mode. A const object starts at 1.',code:'const item = { count: 1 }; item.count = 2;',question:'What does item.count contain?',choices:['2','1','A compile error'],correct:0,mechanism:'The property changes, not the binding.',reference:'2, because the object property remains mutable.',rubric:['Distinguish binding and property','Trace the assignment'],fixtures:{correctReason:'The property changes to 2, while the const binding is unchanged.',incorrectReason:'const freezes every property so the value is still 1.'}},
  transfer:{scenario:'The property is explicitly readonly in its type.',code:'const item: {readonly count: number} = {count: 1}; item.count = 2;',question:'Does TypeScript accept this property assignment?',choices:['No, readonly prevents this assignment in the type checker','Yes, const objects are always mutable','No, every const assignment is forbidden'],correct:0,mechanism:'readonly adds a static property restriction; const restricts the binding.',reference:'The checker rejects the assignment to a readonly property.',rubric:['Identify readonly rather than const','Separate static and runtime behavior'],fixtures:{correctReason:'readonly statically rejects the property write; const alone would allow it.',incorrectReason:'const always freezes an object at runtime.'}}
}};
const generate=async<T>():Promise<T>=>structuredClone(lesson) as T;
function reviewer(reason:string,correct=true){return async<T>():Promise<T>=>({correctness:correct?2:0,causality:correct?2:0,application:correct?2:0,quote:reason.slice(0,20),feedback:'Specific feedback.',misconception:correct?'':'The mechanism is wrong.',followUp:'What changes if the input changes?'} satisfies TopicReview) as T;}
async function create(topicId='typescript.inference'){return (await topicAction('new',{topicId},'en',generate) as TopicPayload).session.id;}

test('all six paths can start a persisted practice; unknown topics cannot call the model',async()=>{
  for(const id of ['typescript.inference','html-css.semantics','dotnet.types','mysql.model','sqlserver.model','postgresql.model']){
    const session=await create(id);assert.equal(getTopic(session).topicId,id);
    assert.equal((await topicAction('latest',{topicId:id},'zh') as TopicPayload).session.id,session);
  }
  let called=false;await assert.rejects(topicAction('new',{topicId:'arbitrary'},'en',async<T>()=>{called=true;return {} as T;}),/Unknown topic/);assert.equal(called,false);
});
test('answer keys, mechanisms and fixtures remain private until reference reveal',async()=>{
  const id=await create();const result=publicTopic(getTopic(id));
  assert.equal('correct' in result.session.lesson.tasks.try,false);assert.equal('fixtures' in result.session.lesson.tasks.try,false);assert.deepEqual(result.references,{});
  const helped=await topicAction('reference',{id,step:'try'},'en') as TopicPayload;assert.ok(helped.references.try?.includes(lesson.tasks.try.reference));assert.equal(helped.references.transfer,undefined);
});
test('two specific independent answers are required; support cannot become independent proof',async()=>{
  const id=await create();const reason=lesson.tasks.try.fixtures.correctReason;
  await topicAction('answer',{id,step:'try',choice:0,reason},'en',reviewer(reason));assert.equal(topicStatus(getTopic(id)),'practicing');
  const transfer=lesson.tasks.transfer.fixtures.correctReason;await topicAction('answer',{id,step:'transfer',choice:0,reason:transfer},'en',reviewer(transfer));assert.equal(topicStatus(getTopic(id)),'first-proof');
  await topicAction('reference',{id,step:'try'},'en');assert.equal(topicStatus(getTopic(id)),'supported');
  assert.equal(topicProgress('typescript').topics['typescript.inference']?.status,'supported');
  const wrong=await create();await topicAction('answer',{id:wrong,step:'try',choice:1,reason},'en',reviewer(reason));await topicAction('answer',{id:wrong,step:'transfer',choice:0,reason:transfer},'en',reviewer(transfer));assert.equal(topicStatus(getTopic(wrong)),'practicing');
});
test('connection failures preserve drafts and do not count as evaluated retries',async()=>{
  const id=await create();const reason=lesson.tasks.try.fixtures.correctReason;
  await topicAction('draft',{id,step:'try',choice:0,reason},'en');
  await topicAction('step',{id,step:'transfer'},'en');
  assert.equal((await topicAction('load',{id},'en') as TopicPayload).session.current,'transfer');
  await assert.rejects(topicAction('answer',{id,step:'try',choice:0,reason},'en',async()=>{throw new Error('network unavailable');}),/network unavailable/);
  assert.equal(getTopic(id).drafts.try.reason,reason);assert.equal(getTopic(id).attempts.try[0].review,undefined);
  await topicAction('answer',{id,step:'try',choice:0,reason},'en',reviewer(reason));assert.equal(getTopic(id).attempts.try[1].supported,false);
  assert.ok(exportData().topicSessions.some(s=>s.id===id));
});
test('reject malformed lesson keys and fabricated assessment evidence',()=>{
  assert.doesNotThrow(()=>validateTopicLesson(lesson));
  const invalid=structuredClone(lesson);invalid.tasks.try.correct=3;assert.throws(()=>validateTopicLesson(invalid),/incomplete/);
  const duplicate=structuredClone(lesson);duplicate.tasks.transfer=duplicate.tasks.try;assert.throws(()=>validateTopicLesson(duplicate),/distinct/);
  assert.throws(()=>validateTopicReview({correctness:2,causality:2,application:2,quote:'fabricated excerpt',feedback:'ok',misconception:'',followUp:'why'},'my real answer'),/valid evidence/);
});
test('parallel mutations cannot lose assistance or a saved response during assessment',async()=>{
  const id=await create();const reason=lesson.tasks.try.fixtures.correctReason;
  let release:()=>void=()=>{};const wait=new Promise<void>(resolve=>{release=resolve;});
  const answer=topicAction('answer',{id,step:'try',choice:0,reason},'en',async<T>()=>{await wait;return reviewer(reason)<T>();});
  await assert.rejects(topicAction('reference',{id,step:'try'},'en'),/assessment is running/);
  await assert.rejects(topicAction('draft',{id,step:'try',choice:2,reason:'changed answer'},'en'),/assessment is running/);
  release();await answer;assert.equal(getTopic(id).drafts.try.reason,reason);
});
