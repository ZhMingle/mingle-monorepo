import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {englishInput,englishBatchInput,validateEnglishPoint} from '../shared/english.ts';
const scratch=mkdtempSync(join(tmpdir(),'clarity-english-'));
process.env.DATA_DIR=scratch;
const {lookupEnglish,englishCards,updateEnglishCard,deleteEnglishCard}=await import('../server/english.ts');
const {db}=await import('../server/store.ts');

test('batch inputs preserve phrases, normalize duplicates, and validate everything before generation',()=>{
  assert.deepEqual(englishBatchInput('stem; trunk； take in\nroot\nSTEM; inherently').map(item=>item.query),['STEM','trunk','take in','root','inherently']);
  assert.equal(englishBatchInput('significantly vs very huge')[0].query,'significantly vs very huge');
  for(const value of ['', 'x'.repeat(161),Array.from({length:51},(_,i)=>'word'+i).join(';')])assert.throws(()=>englishBatchInput(value));
  assert.equal(englishBatchInput('take in; root','shared sentence')[1].context,'shared sentence');
});
test('batch members save independently, failed items retry and successes reuse saved cards',async()=>{
  const items=englishBatchInput('batch-stem; batch-failure; batch-root');
  let calls=0;
  for(const item of items){try{await lookupEnglish(item,async<T>()=>{calls++;if(item.query==='batch-failure')throw Error('offline');return {...structuredClone(point),term:item.query} as T;});}catch{}}
  assert.equal(calls,3);
  assert.ok(englishCards().some(card=>card.query==='batch-root'));
  assert.ok(!englishCards().some(card=>card.query==='batch-failure'));
  await lookupEnglish(items[1],async<T>()=>({...structuredClone(point),term:items[1].query}) as T);
  await lookupEnglish(items[0],async()=>{throw Error('Saved success must not regenerate');});
});
after(()=>{db.close();rmSync(scratch,{recursive:true,force:true});});
const point={term:'figure out',kind:'expression',pronunciation:'',meaning:'想明白，弄清楚。',usage:'遇到问题、还在找答案时可以用。',examples:[{english:'I figured out how to fix it.',chinese:'我弄清楚怎么修好了。'},{english:'Let’s figure out where to eat.',chinese:'我们想想去哪儿吃。'}],pitfall:'figure out 强调想出答案，不只是知道一件事。',related:[{term:'work out',meaning:'想出办法'}]};
test('lookup deduplicates simultaneous requests and persists reusable cards without calling AI again',async()=>{
  let calls=0;const run=async<T>()=>{calls++;return structuredClone(point) as T;};
  const [a,b]=await Promise.all([lookupEnglish({query:'  figure   out  '},run),lookupEnglish({query:'FIGURE OUT'},run)]);
  assert.equal(calls,1);assert.equal(a.card.id,b.card.id);
  const cached=await lookupEnglish({query:'Figure out'},run);
  assert.equal(cached.cached,true);assert.equal(calls,1);
  assert.equal(englishCards().find(c=>c.id===a.card.id)?.meaning,point.meaning);
  const contextual=await lookupEnglish({query:'figure out',context:'Can you figure out the total?'},run);
  assert.equal(contextual.card.id,a.card.id);assert.equal(calls,1);
  const starred=updateEnglishCard({id:a.card.id,favorite:true});
  assert.equal(starred.favorite,true);assert.equal((await lookupEnglish({query:'figure out'},run)).card.favorite,true);
  assert.equal(starred.meaning,point.meaning);
  deleteEnglishCard({id:a.card.id});assert.ok(!englishCards().some(c=>c.id===a.card.id));
});
test('invalid inputs and AI responses never create saved cards; failed requests can retry',async()=>{
  for(const input of [{query:''},{query:'x'.repeat(161)},{query:'word',context:123}])assert.throws(()=>englishInput(input));
  assert.throws(()=>validateEnglishPoint({...point,examples:[]}),/不完整/);
  const count=englishCards().length;
  await assert.rejects(lookupEnglish({query:'invalid-output'},async<T>()=>({term:'bad'}) as T),/不完整/);
  assert.equal(englishCards().length,count);
  await assert.rejects(lookupEnglish({query:'network-retry'},async()=>{throw new Error('Connection failed');}),/Connection failed/);
  assert.equal(englishCards().length,count);
  await lookupEnglish({query:'network-retry'},async<T>()=>({...structuredClone(point),term:'network-retry'}) as T);
  assert.equal(englishCards().length,count+1);
  assert.throws(()=>updateEnglishCard({id:'missing',favorite:true}),/不存在/);
  assert.throws(()=>updateEnglishCard({id:'missing',favorite:'yes'}),/无效/);
});
test('canonical titles reuse existing cards before AI; stable numbers are unique and never reused',async()=>{
  const first=await lookupEnglish({query:'number-test-a'},async<T>()=>({...structuredClone(point),term:'Number Alpha'}) as T);
  assert.ok(Number.isInteger(first.card.number));
  const reused=await lookupEnglish({query:'  NUMBER   ALPHA ',context:'different context'},async()=>{throw Error('Must reuse existing title before AI');});
  assert.equal(reused.card.id,first.card.id);assert.equal(reused.card.number,first.card.number);
  const second=await lookupEnglish({query:'number-test-b'},async<T>()=>({...structuredClone(point),term:'Number Beta'}) as T);
  assert.ok(second.card.number>first.card.number);
  deleteEnglishCard({id:second.card.id});
  const third=await lookupEnglish({query:'number-test-c'},async<T>()=>({...structuredClone(point),term:'Number Gamma'}) as T);
  assert.ok(third.card.number>second.card.number);
  assert.equal(updateEnglishCard({id:first.card.id,favorite:true}).number,first.card.number);
  assert.equal(englishCards().find(card=>card.id===first.card.id)?.number,first.card.number);
});
