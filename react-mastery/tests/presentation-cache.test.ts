import test from 'node:test';
import assert from 'node:assert/strict';
import {PresentationCache} from '../src/presentation-cache.ts';
import {present,presentationStrings} from '../shared/presentation.ts';
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

test('prepared response text is available on the first render without a translation request',async()=>{
  let calls=0;const cache=new PresentationCache(async()=>{calls++;throw Error('No second request is needed');});
  const payload={question:'Which value?',preparedPresentations:{version:'prepared-presentation-v1',translations:{zh:{'Which value?':'哪个值？'}}}};
  assert.deepEqual(presentationStrings(payload),['Which value?']);
  cache.seed(payload,'zh',payload.preparedPresentations.translations.zh);
  assert.equal(present(payload,cache.get(payload,'zh')!).question,'哪个值？');
  await cache.prepare(payload,'zh');assert.equal(calls,0);
});

test('new feedback reuses lesson text while changed authored identifiers remain isolated',async()=>{
  const requests:{texts:string[];identifiers:string[]}[]=[];
  const cache=new PresentationCache(async(texts,_language,identifiers)=>{requests.push({texts,identifiers});return Object.fromEntries(texts.map(text=>[text,'中文 '+text]));});
  const payload={session:{lesson:{overview:'Read this lesson.',coding:{starter:'function NameEditor() {}'}}}};
  await cache.prepare(payload,'zh');
  const updated={...payload,attempts:[{feedback:'New feedback.'}]};await cache.prepare(updated,'zh');
  assert.deepEqual(requests[1].texts,['New feedback.']);assert.equal(cache.get(updated,'zh')?.['Read this lesson.'],'中文 Read this lesson.');
  const other={session:{lesson:{overview:'Read this lesson.',coding:{starter:'function OtherEditor() {}'}}}};assert.equal(cache.get(other,'zh'),undefined);
  await cache.prepare(other,'zh');assert.deepEqual(requests[2].identifiers,['OtherEditor']);
});

test('a prepared bundle cannot corrupt protected code or mark incomplete text ready',()=>{
  const payload={question:'Check `a.name` and choose.'};const cache=new PresentationCache(async()=>({}));
  const [text]=presentationStrings(payload);cache.seed(payload,'zh',{[text]:'丢失代码。'});assert.equal(cache.get(payload,'zh'),undefined);
});
