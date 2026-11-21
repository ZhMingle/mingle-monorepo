import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {englishInput,englishBatchInput,validateEnglishPoint} from '../shared/english.ts';
const scratch=mkdtempSync(join(tmpdir(),'clarity-english-'));
process.env.DATA_DIR=scratch;
const {lookupEnglish,englishCards,updateEnglishCard,deleteEnglishCard}=await import('../server/english.ts');
const {planEnglishCards}=await import('../server/english-plan.ts');
const {db}=await import('../server/store.ts');

test('batch inputs preserve phrases, normalize duplicates, and validate everything before generation',()=>{
  assert.deepEqual(englishBatchInput('stem; trunk； take in\nroot\nSTEM; inherently').map(item=>item.query),['STEM','trunk','take in','root','inherently']);
  assert.equal(englishBatchInput('significantly vs very huge')[0].query,'significantly vs very huge');
  for(const value of ['', 'x'.repeat(301),Array.from({length:51},(_,i)=>'word'+i).join(';')])assert.throws(()=>englishBatchInput(value));
  assert.deepEqual(englishBatchInput('I wanted to help; it was too late.\nstem; root').map(item=>item.query),['I wanted to help; it was too late.','stem','root']);
  assert.equal(englishBatchInput('x'.repeat(300))[0].query.length,300);
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
const point={term:'figure out',kind:'expression',pronunciation:'',meaning:'想明白，弄清楚。',usage:'遇到问题、还在找答案时可以用。',examples:[{english:'I figured out how to fix it.',chinese:'我弄清楚怎么修好了。'},{english:'Let’s figure out where to eat.',chinese:'我们想想去哪儿吃。'}],pitfall:'figure out 强调想出答案，不只是知道一件事。',related:[{term:'work out',meaning:'想出办法'}],inputKind:'expression',sourceTranslation:'',sourceSentence:'',sourceCorrection:'',partOfSpeech:'v.',chunk:{english:'figure out a solution',chinese:'想出解决办法'},memory:{association:'想象把打结的耳机线理顺，终于弄明白解决办法。',sound:'',parts:''}};

test('card planning keeps every item and groups only the selected entries in input order',async()=>{
  const entries=['I think','root','I reckon','in my opinion','in my view','branch'];
  const comparison=[entries[0],...entries.slice(2,5)];
  const batch=entries.join(' / ');
  const response=(groups:number[][])=>({groups:groups.map(group=>group.map(index=>({index,text:entries[index]})))});
  const plan=await planEnglishCards(batch,async<T>()=>response([[5],[4,2,0,3],[1]]) as T);
  assert.deepEqual(plan.map(item=>item.query),[comparison.join(' / '),'root','branch']);
  assert.deepEqual(plan[0].comparison,comparison);
  assert.equal(plan[1].comparison,undefined);
  await assert.rejects(planEnglishCards(batch,async<T>()=>response([[0,2,3,4],[1],[1]]) as T),/完整的卡片分组/);
  const sentence='I waited; then I left.';
  assert.equal((await planEnglishCards(sentence,async<T>()=>({groups:[[{index:0,text:sentence}]]}) as T))[0].query,sentence);
});

test('explicit comparisons survive a mixed line ending in a punctuated source',async()=>{
  const input="theatrical Vs drama; share VS stock, About the crash in Hartes' share prices.";
  const expected=[
    ['theatrical Vs drama',['theatrical','drama']],
    ['share VS stock',['share','stock']],
    ["About the crash in Hartes' share prices.",undefined],
  ];
  const summaries=(items:ReturnType<typeof englishBatchInput>)=>items.map(item=>[item.query,item.comparison]);
  assert.deepEqual(summaries(englishBatchInput(input)),expected);
  assert.deepEqual(summaries(await planEnglishCards(input,async<T>()=>({groups:[[{index:2,text:expected[2][0]}]]}) as T)),expected);
  assert.deepEqual(summaries(await planEnglishCards('root\nshare vs. stock\nbranch',async<T>()=>({groups:[[{index:2,text:'branch'}],[{index:0,text:'root'}]]}) as T)),[
    ['root',undefined],['share vs. stock',['share','stock']],['branch',undefined],
  ]);
  assert.deepEqual(summaries(englishBatchInput('I called him; then I waited, but he never answered.')),[
    ['I called him; then I waited, but he never answered.',undefined],
  ]);
});

test('planning infers loose boundaries and rejects output that skips words',async()=>{
  const input='generous stingy, branch';
  const grouped=[{index:0,text:'generous'},{index:0,text:'stingy'}];
  const branch={index:0,text:'branch'};
  const items=await planEnglishCards(input,async<T>()=>({groups:[[branch],grouped]}) as T);
  assert.deepEqual(items.map(item=>[item.query,item.comparison]),[
    ['generous / stingy',['generous','stingy']],['branch',undefined],
  ]);
  await assert.rejects(planEnglishCards(input,async<T>()=>({groups:[[branch]]}) as T),/完整的卡片分组/);
});

test('comparison cards preserve alternatives even when a standalone card already exists',async()=>{
  const comparison=['I think','I reckon','in my opinion','in my view'];
  const run=async<T>()=>({...structuredClone(point),term:'I think',related:comparison.slice(1).map(term=>({term,meaning:'表达看法'}))}) as T;
  const standalone=await lookupEnglish({query:'I think'},run);
  const group=await lookupEnglish({comparison},run);
  assert.notEqual(group.card.id,standalone.card.id);
  assert.deepEqual(group.card.related.map(item=>item.term),comparison.slice(1));
  assert.equal((await lookupEnglish({comparison:comparison.toReversed()},async()=>{throw Error('Comparison already saved');})).card.id,group.card.id);
  assert.equal((await lookupEnglish({query:'I think'})).card.id,standalone.card.id);
  await assert.rejects(lookupEnglish({comparison:['in my opinion','I believe']},run),/完整保留对照表达/);
});
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
  for(const input of [{query:''},{query:'x'.repeat(301)},{query:'word',context:123}])assert.throws(()=>englishInput(input));
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

test('sentence input keeps the raw query but stores a corrected sentence and its translation',async()=>{
  const query="She don't live in the vicinity.";
  const original={english:"She doesn't live in the vicinity.",chinese:'她不住在这附近。'};
  const {card}=await lookupEnglish({query},async<T>()=>({...structuredClone(point),term:'in the vicinity',inputKind:'sentence',sourceSentence:original.english,sourceCorrection:"She don't → She doesn't：第三人称单数。",sourceTranslation:original.chinese}) as T);
  assert.equal(card.term,'in the vicinity');assert.equal(card.query,query);
  assert.equal(card.sources?.[0].input,query);assert.equal(card.sources?.[0].english,original.english);
  assert.deepEqual(card.examples,[original,...point.examples]);
  const reopened=await lookupEnglish({query},async()=>{throw Error('Saved sentence must not regenerate');});
  assert.equal(reopened.card.id,card.id);assert.equal(reopened.cached,true);
  assert.deepEqual(englishCards().find(item=>item.id===card.id)?.examples,card.examples);
});

test('new sentences append to an existing word without losing examples, identity or favorites',async()=>{
  const saved=await lookupEnglish({query:'sentence-merge-word'},async<T>()=>({...structuredClone(point),term:'look forward to'}) as T);
  const before=updateEnglishCard({id:saved.card.id,favorite:true});const count=englishCards().length;
  const first='I look forward to meeting you';
  const second='We look forward to your visit.';
  const generate=(query:string)=>lookupEnglish({query},async<T>()=>({...structuredClone(point),term:before.term,inputKind:'sentence',sourceSentence:query,sourceTranslation:'我们期待相见。'}) as T);
  const [a,b]=await Promise.all([generate(first),generate(second)]);
  assert.equal(a.card.id,b.card.id);assert.equal(b.card.id,before.id);assert.equal(b.card.number,before.number);assert.equal(b.card.favorite,true);
  assert.equal(englishCards().length,count);
  const after=englishCards().find(card=>card.id===before.id)!;
  for(const example of [...before.examples,{english:first},{english:second}])assert.ok(after.examples.some(item=>item.english===example.english));
  assert.equal(after.usage,before.usage);assert.equal(after.createdAt,before.createdAt);
  assert.ok(after.sources?.some(source=>source.input===first));assert.ok(after.sources?.some(source=>source.input===second));
  const replay=await lookupEnglish({query:first},async()=>{throw Error('Merged sentence must reuse the card');});
  assert.equal(replay.card.examples.filter(example=>example.english===first).length,1);
});

test('missing or invalid source translations cannot mutate existing cards',async()=>{
  const before=englishCards();
  for(const patch of [{inputKind:'sentence',sourceTranslation:''},{inputKind:'sentence',sourceTranslation:'x'.repeat(301)},{inputKind:'invalid',sourceTranslation:''}]){
    await assert.rejects(lookupEnglish({query:'A new sentence about figure out.'},async<T>()=>({...structuredClone(point),...patch}) as T),/原句信息不完整/);
    assert.deepEqual(englishCards(),before);
  }
});
