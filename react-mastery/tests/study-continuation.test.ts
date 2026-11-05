import test from 'node:test';
import assert from 'node:assert/strict';
import {completedKinds} from '../shared/study.ts';
import type {StudyAttempt,StudySession} from '../shared/study.ts';
const attempt=(kind:StudyAttempt['kind'],accepted=true,error?:string):StudyAttempt=>({kind,accepted,error,input:'test',at:'2026-10-27',supported:false});

test('completion records evidence independently of unrestricted topic navigation',()=>{
  const completed=(attempts:StudyAttempt[])=>completedKinds({attempts} as StudySession);
  assert.deepEqual(completed([]),[]);
  assert.deepEqual(completed([attempt('choice')]),['choice']);
  assert.deepEqual(completed([attempt('code')]),['code']);
  assert.deepEqual(completed([attempt('choice'),attempt('code',false)]),['choice']);
  assert.deepEqual(completed([attempt('choice'),attempt('code',true,'Review failed')]),['choice']);
  assert.deepEqual(completed([attempt('keywords'),attempt('choice')]),['choice']);
  assert.deepEqual(completed([attempt('choice'),attempt('code')]),['choice','code']);
});
