import test from 'node:test';
import assert from 'node:assert/strict';
import {canContinueStudy} from '../shared/study.ts';
import type {StudyAttempt} from '../shared/study.ts';
const attempt=(kind:StudyAttempt['kind'],accepted=true,error?:string):StudyAttempt=>({kind,accepted,error,input:'test',at:'2026-10-27',supported:false});
test('continuation requires successful choice and code in this exercise',()=>{
  assert.equal(canContinueStudy(null),false);
  assert.equal(canContinueStudy({attempts:[]}),false);
  assert.equal(canContinueStudy({attempts:[attempt('choice')]}),false);
  assert.equal(canContinueStudy({attempts:[attempt('code')]}),false);
  assert.equal(canContinueStudy({attempts:[attempt('choice'),attempt('code',false)]}),false);
  assert.equal(canContinueStudy({attempts:[attempt('choice'),attempt('code',true,'Review failed')]}),false);
  assert.equal(canContinueStudy({attempts:[attempt('keywords'),attempt('choice')]}),false);
  assert.equal(canContinueStudy({attempts:[attempt('choice'),attempt('code')]}),true);
  assert.equal(canContinueStudy({attempts:[attempt('choice'),attempt('code',false),attempt('code')]}),true);
  // Starting a new variation must not inherit the previous session's unlock.
  assert.equal(canContinueStudy({attempts:[]}),false);
});
