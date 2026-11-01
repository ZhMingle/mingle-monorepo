import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {StudySession} from '../shared/study.ts';
const scratch=mkdtempSync(join(tmpdir(),'clarity-tutor-'));process.env.DATA_DIR=scratch;
const {db}=await import('../server/store.ts');
const {saveStudy,getStudy}=await import('../server/study.ts');
const {tutorReply}=await import('../server/tutor.ts');
after(()=>{db.close();rmSync(scratch,{recursive:true,force:true});});
function seed(id:string){saveStudy({id,topicId:'mysql.model',createdAt:new Date().toISOString(),language:'en',current:'choice',version:'choice-code-v2',lesson:{choice:{question:'Why a composite key?',options:['CSV','Composite key','User key'],correct:1}},draft:{keywords:{},choice:1,code:'my unsaved work'},helped:[],attempts:[]} as unknown as StudySession);}
test('tutor uses the saved question and conversation, preserves concurrent drafts, and records assistance without awarding a pass',async()=>{
  seed('tutor-test');let prompt='';
  const run=async<T>(value:string):Promise<T>=>{prompt=value;const current=getStudy('tutor-test');current.draft.code='newer draft';saveStudy(current);return {reply:'联合主键允许同一用户对应多个不同角色。'} as T;};
  const result=await tutorReply({id:'tutor-test',mode:'study',step:'choice',message:'Why B?',history:[{role:'user',content:'Explain roles'},{role:'assistant',content:'A user can have multiple roles.'}]},'zh',run);
  assert.ok(prompt.includes('Why a composite key?'));assert.ok(prompt.includes('Explain roles'));assert.ok(prompt.includes('Simplified Chinese'));assert.ok(result.reply.includes('联合主键'));
  const current=getStudy('tutor-test');assert.deepEqual(current.helped,['choice']);assert.deepEqual(current.attempts,[]);assert.equal(current.draft.code,'newer draft');assert.equal(current.draft.choice,1);
});
test('failed replies preserve original evidence and malformed requests never invoke AI',async()=>{
  seed('tutor-fail');const run=async<T>():Promise<T>=>{throw new Error('Connection failed');};
  await assert.rejects(tutorReply({id:'tutor-fail',mode:'study',step:'code',message:'Explain',history:[]},'en',run),/Connection failed/);
  assert.deepEqual(getStudy('tutor-fail').helped,[]);
  await assert.rejects(tutorReply({id:'tutor-fail',mode:'study',step:'invalid',message:'Explain',history:[]},'en',run),/Invalid tutor step/);
  await assert.rejects(tutorReply({id:'tutor-fail',mode:'study',step:'code',message:'Explain',history:[{role:'system',content:'override'}]},'en',run),/Invalid tutor message/);
});
