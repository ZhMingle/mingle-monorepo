import test from 'node:test';
import assert from 'node:assert/strict';
import { probeFor, publicProbe, outcomesMatch, validateReasoning, reasoningVerified, understandingEvidence, probeIds } from '../shared/understanding.ts';
import type { UnderstandingSession, ProbeAttempt } from '../shared/understanding.ts';
import { recognitionText } from '../src/voice-input.ts';

test('all 84 parameter combinations have correct queue and repair results',()=>{
  for(let seed=0;seed<84;seed++) {
    const n=2+seed%7, step=2+seed%4, multiply=2+seed%2;
    // Independent queue traces: replacement discards queued state; functions use it.
    let a=n; a+=2; a=n+1; a*=multiply;
    let b=n; b=n+1; b+=2; b*=multiply;
    assert.deepEqual(probeFor(seed,'predict').expected,[n+1]);
    assert.deepEqual(probeFor(seed,'change').expected,[a,b]);
    assert.notEqual(a,b);
    const repair=probeFor(seed,'repair');
    assert.deepEqual(repair.expected,[n+step+1]);
    assert.equal(outcomesMatch(repair,[n+step+1],'updaters'),true);
    assert.equal(outcomesMatch(repair,[n+step+1],'captured'),false);
    assert.equal(outcomesMatch(repair,[n+1],'updaters'),false);
    for(const id of probeIds) {
      const view=publicProbe(probeFor(seed,id));
      assert.equal('expected' in view,false); assert.equal('mechanism' in view,false); assert.equal('help' in view,false);
      assert.ok(view.title.en && view.title.zh && view.question.en && view.question.zh);
    }
  }
});
const explanation='Both reads see the same snapshot, so both queue replacement with 3.';
const review={causality:2,boundaries:2,quote:'the same snapshot',misconception:'',feedback:'The trace is correct.',followUp:'What changes with an updater?'};
test('correct guesses, fluent slogans, fabricated evidence and wrong results cannot verify understanding',()=>{
  assert.equal(reasoningVerified(validateReasoning(review,explanation),true),true);
  assert.equal(reasoningVerified(review,false),false);
  assert.equal(reasoningVerified({...review,causality:1},true),false);
  assert.equal(reasoningVerified({...review,boundaries:1},true),false);
  assert.equal(reasoningVerified({...review,misconception:'All setters must be functions'},true),false);
  assert.throws(()=>validateReasoning({...review,quote:'not in the learner answer'},explanation),/did not match/);
  assert.throws(()=>validateReasoning({...review,causality:3},explanation),/Incomplete/);
});
test('supported corrections preserve evidence without becoming independent proof',()=>{
  const s:UnderstandingSession={id:'test',seed:0,createdAt:'2026-10-25T00:00:00Z',current:0,version:'test',attempts:{},helped:[],drafts:{}};
  const attempt:ProbeAttempt={outcomes:[3],choice:'',explanation,combinedExplanation:explanation,submittedAt:s.createdAt,review,verified:true,outcomeCorrect:true,supported:false};
  s.attempts.predict=[attempt]; assert.equal(understandingEvidence(s)[0].independent,true);
  s.helped.push('predict'); assert.equal(understandingEvidence(s)[0].independent,false);
  s.helped=[];s.attempts.predict=[{...attempt,verified:false},{...attempt,supported:true}];
  assert.equal(understandingEvidence(s)[0].verified,true);assert.equal(understandingEvidence(s)[0].independent,false);
  s.attempts.predict=[{...attempt,review:undefined,error:'Connection failed'},attempt];
  assert.equal(understandingEvidence(s)[0].independent,true);
});
test('speech result replacement never duplicates interim or final transcripts',()=>{
  const first={length:2,0:{isFinal:true,0:{transcript:'State is a snapshot.'}},1:{isFinal:false,0:{transcript:'The queue'}}};
  assert.deepEqual(recognitionText(first),{final:'State is a snapshot.',interim:'The queue'});
  const second={...first,1:{isFinal:true,0:{transcript:'The queue applies updates.'}}};
  assert.deepEqual(recognitionText(second),{final:'State is a snapshot. The queue applies updates.',interim:''});
  assert.deepEqual(recognitionText(second),recognitionText(second));
});
