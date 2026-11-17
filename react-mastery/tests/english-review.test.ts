import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reviewQueue} from '../src/english-review.ts';
import type {EnglishCard} from '../shared/english.ts';
test('review repeats the chunk three times and manual mode stays on the current card',()=>{
  const cards=[{id:'a',term:'wave',chunk:{english:'on a wave of support',chinese:'在一片支持声中'}},{id:'b',term:'stem',chunk:{english:'a flower stem',chinese:'花梗'}}] as EnglishCard[];
  const manual=reviewQueue(cards,0,3,false);assert.equal(manual.length,3);assert.deepEqual(manual.map(item=>item.iteration),[1,2,3]);assert.ok(manual.every(item=>item.cardId==='a'&&item.text==='on a wave of support'));
  const auto=reviewQueue(cards,0,3,true);assert.deepEqual(auto.map(item=>item.cardId),['a','a','a','b','b','b']);
  const resume=reviewQueue(cards,0,3,true,2);assert.deepEqual(resume.map(item=>item.iteration),[2,3,1,2,3]);
  assert.equal(reviewQueue(cards,1,1,true).length,1);assert.throws(()=>reviewQueue(cards,0,0,true));assert.throws(()=>reviewQueue(cards,2,3,true));
});
