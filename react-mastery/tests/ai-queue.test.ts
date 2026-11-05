import test from 'node:test';
import assert from 'node:assert/strict';
import { AiQueue } from '../server/ai-queue.ts';

function gate(){let release!:()=>void;const promise=new Promise<void>(resolve=>{release=resolve;});return {promise,release};}

test('concurrent learner requests wait without rejection or overlapping execution',async()=>{
  const queue=new AiQueue();const first=gate();const started=gate();const events:string[]=[];
  const a=queue.run(async()=>{events.push('a-start');started.release();await first.promise;events.push('a-end');return 'a-result';});
  await started.promise;
  const b=queue.run(async()=>{events.push('b');return 'b-result';});
  const c=queue.run(async()=>{events.push('c');return 'c-result';});
  assert.deepEqual(events,['a-start']);first.release();
  assert.deepEqual(await Promise.all([a,b,c]),['a-result','b-result','c-result']);
  assert.deepEqual(events,['a-start','a-end','b','c']);
});

test('queued learner actions run before queued translations and preserve each result',async()=>{
  const queue=new AiQueue();const first=gate();const started=gate();const order:string[]=[];
  const active=queue.run(async()=>{started.release();await first.promise;},'translation');
  await started.promise;
  const background=queue.run(async()=>{order.push('translation');return 'translated';},'translation');
  const learner=queue.run(async()=>{order.push('learner');return 'assessment';});
  first.release();
  assert.deepEqual(await Promise.all([active,background,learner]),[undefined,'translated','assessment']);
  assert.deepEqual(order,['learner','translation']);
});

test('failed or synchronously throwing jobs do not strand later requests',async()=>{
  const queue=new AiQueue();const first=gate();const started=gate();
  const bad=queue.run(async()=>{started.release();await first.promise;throw new Error('connection failed');});
  const checked=assert.rejects(bad,/connection failed/);await started.promise;
  const next=queue.run(async()=>42);first.release();await checked;assert.equal(await next,42);
  await assert.rejects(queue.run(()=>{throw new Error('spawn failed');}),/spawn failed/);
  assert.equal(await queue.run(async()=>43),43);
});

test('queued prefetch waits behind learner actions and visible translations',async()=>{
  const queue=new AiQueue();const first=gate();const started=gate();const order:string[]=[];
  const active=queue.run(async()=>{started.release();await first.promise;},'background');await started.promise;
  const background=queue.run(async()=>{order.push('prefetch');},'background');
  const translation=queue.run(async()=>{order.push('translation');},'translation');
  const learner=queue.run(async()=>{order.push('learner');});
  first.release();await Promise.all([active,background,translation,learner]);
  assert.deepEqual(order,['learner','translation','prefetch']);
});
test('assessment completes while a background CLI job remains blocked',async()=>{
  for(const priority of ['background','translation'] as const){
    const queue=new AiQueue();const blocked=gate();const started=gate();
    const background=queue.run(async()=>{started.release();await blocked.promise;},priority);
    await started.promise;
    try { assert.equal(await queue.run(async()=>42),42); }
    finally { blocked.release();await background; }
  }
});
