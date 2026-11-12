import test from 'node:test';
import assert from 'node:assert/strict';
import {PresentationCache} from '../src/presentation-cache.ts';
import {present} from '../shared/presentation.ts';
test('both prepared languages switch synchronously without another request and preserve code',async()=>{
  let calls=0;
  const cache=new PresentationCache(async(texts,language)=>{calls++;return Object.fromEntries(texts.map(text=>[text,language+':'+text]));});
  const payload={scenario:'Read this example',starter:'SELECT 1;',draft:{code:'my answer'}};
  await Promise.all([cache.prepare(payload,'zh'),cache.prepare(payload,'en',true),cache.prepare(payload,'en',true)]);
  assert.equal(calls,2);
  for(const language of ['en','zh','en'] as const){
    const translations=cache.get(payload,language);assert.ok(translations);
    const view=present(payload,translations);assert.equal(view.scenario,language+':Read this example');
    assert.equal(view.starter,payload.starter);assert.deepEqual(view.draft,payload.draft);
  }
  assert.equal(calls,2);
});
test('failed background language can retry without replacing the ready language',async()=>{
  let fail=true;
  const cache=new PresentationCache(async(texts,language)=>{if(language==='en'&&fail)throw Error('offline');return Object.fromEntries(texts.map(text=>[text,language]));});
  const payload={question:'Which value?'};
  await cache.prepare(payload,'zh');await assert.rejects(cache.prepare(payload,'en',true),/offline/);
  assert.equal(cache.get(payload,'zh')?.['Which value?'],'zh');assert.equal(cache.get(payload,'en'),undefined);
  fail=false;await cache.prepare(payload,'en',true);assert.equal(cache.get(payload,'en')?.['Which value?'],'en');
});
