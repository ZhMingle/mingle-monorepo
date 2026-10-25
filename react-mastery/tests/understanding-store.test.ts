import { test,after } from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const scratch=mkdtempSync(join(tmpdir(),'clarity-understanding-test-'));
process.env.DATA_DIR=scratch;
const {db,exportData}=await import('../server/store.ts');
const {createUnderstanding,getUnderstanding,saveUnderstanding,understandingAction,understandingPayload}=await import('../server/understanding.ts');
after(()=>{db.close();for(const name of ['learning.sqlite','learning.sqlite-wal','learning.sqlite-shm'])rmSync(join(scratch,name),{force:true});rmdirSync(scratch);});
test('drafts and help persist, stale requests cannot advance, and evidence is exported',async()=>{
  const s=createUnderstanding();
  await understandingAction('draft',{id:s.id,probe:'predict',outcomes:['7'],choice:'',explanation:'My original explanation.'},'en');
  await understandingAction('help',{id:s.id,probe:'predict'},'en');
  assert.equal(getUnderstanding(s.id).drafts.predict?.explanation,'My original explanation.');
  assert.deepEqual(getUnderstanding(s.id).helped,['predict']);
  assert.ok(understandingPayload(getUnderstanding(s.id)).help?.zh);
  await assert.rejects(understandingAction('advance',{id:s.id,probe:'change'},'en'),/question has changed/);
  await assert.rejects(understandingAction('advance',{id:s.id,probe:'predict'},'en'),/Submit this question/);
  assert.ok(exportData().understandingSessions.some(item=>item.id===s.id));
});
test('early practice cannot pretend to be delayed recall and new variations change',()=>{
  const s=createUnderstanding();s.reviewAt=new Date(Date.now()+86400000).toISOString();saveUnderstanding(s);
  assert.throws(()=>createUnderstanding(s.id),/not due yet/);
  const next=createUnderstanding();assert.notEqual(next.seed%7,s.seed%7);
  s.reviewAt=new Date(Date.now()-1000).toISOString();saveUnderstanding(s);
  const review=createUnderstanding(s.id);assert.equal(review.reviewOf,s.id);assert.notEqual(review.seed%7,s.seed%7);
});
