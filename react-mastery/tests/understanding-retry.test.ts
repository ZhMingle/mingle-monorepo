import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {probeFor,probeIds} from '../shared/understanding.ts';
const scratch=mkdtempSync(join(tmpdir(),'clarity-retry-'));process.env.DATA_DIR=scratch;
const {db}=await import('../server/store.ts');
const {createUnderstanding,getUnderstanding,understandingAction}=await import('../server/understanding.ts');
after(()=>{db.close();rmSync(scratch,{recursive:true,force:true});});
const explanation='Each updater uses the queued value, preserving both increments. A direct replacement sets a fixed value.';
const run=async<T>():Promise<T>=>({causality:2,boundaries:2,quote:'Each updater uses the queued value',misconception:'',feedback:'Correct.',followUp:''}) as T;

test('return to questions, retry beyond twice and reopen completed rounds without erasing evidence',async()=>{
  const s=createUnderstanding();
  const answer=async(id:typeof probeIds[number])=>{
    const probe=probeFor(s.seed,id);
    return understandingAction('answer',{id:s.id,probe:id,outcomes:probe.expected,choice:probe.correctChoice??'',explanation},'en',run);
  };
  await answer('predict');
  const first=structuredClone(getUnderstanding(s.id).attempts.predict![0]);
  for(let i=0;i<3;i++)await answer('predict');
  const saved=getUnderstanding(s.id);
  assert.equal(saved.attempts.predict!.length,4);
  assert.deepEqual(saved.attempts.predict![0],first);
  assert.ok(saved.attempts.predict!.slice(1).every(a=>a.supported));
  for(const id of ['change','repair'] as const){
    await understandingAction('select',{id:s.id,target:id},'en');
    await answer(id);
  }
  const complete=await understandingAction('advance',{id:s.id,probe:'repair'},'en');
  assert.ok(complete.session?.completedAt);
  assert.equal(complete.session?.reviewAt,undefined);
  const returned=await understandingAction('select',{id:s.id,target:'predict'},'en');
  assert.equal(returned.task?.id,'predict');
  assert.equal(returned.session?.drafts.predict?.explanation,explanation);
  assert.equal(returned.trail.length,3);
  const retried=await answer('predict');
  assert.equal(retried.evidence[0].independent,false);
  assert.equal(retried.evidence[0].verified,true);
  await assert.rejects(understandingAction('select',{id:s.id,target:'invalid'},'en'),/Unknown question/);
});

test('failed AI calls preserve an editable answer and do not count as evaluated retries',async()=>{
  const s=createUnderstanding();const probe=probeFor(s.seed,'predict');
  const input={id:s.id,probe:'predict',outcomes:probe.expected,choice:'',explanation};
  await assert.rejects(understandingAction('answer',input,'en',async()=>{throw Error('Offline');}),/Offline/);
  const next=await understandingAction('answer',input,'en',run);
  assert.equal(next.evidence[0].independent,true);
  assert.equal(next.evidence[0].attempts,1);
  assert.equal(next.session?.attempts.predict?.length,2);
});
