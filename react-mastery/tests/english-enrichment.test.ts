import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const scratch=mkdtempSync(join(tmpdir(),'clarity-enrich-'));process.env.DATA_DIR=scratch;
const {db}=await import('../server/store.ts');
const {englishCards,updateEnglishCard}=await import('../server/english.ts');
const {enrichEnglish}=await import('../server/english-enrichment.ts');
after(()=>{db.close();rmSync(scratch,{recursive:true,force:true});});
const original={id:'legacy',number:65,term:'desensitized',kind:'word',pronunciation:'',meaning:'不那么敏感的',usage:'逐渐适应噪声。',examples:[{english:'He is desensitized to the noise.',chinese:'他习惯了噪声。'}],pitfall:'注意 to。',related:[],favorite:false,query:'desensitized',context:'',createdAt:'2026-11-17'};
const metadata={id:original.id,partOfSpeech:'adj.',chunk:{english:'be desensitized to something',chinese:'对某事逐渐不再敏感'},memory:{association:'想象调低警报的音量。',sound:'',parts:'de- 表去除，sensitize 表使敏感，-ed 构成分词。'}};
test('legacy enrichment is cached, preserves recent favorites and leaves original examples intact',async()=>{
  db.prepare('INSERT INTO english_cards VALUES(?,?,?,?)').run(original.id,'legacy',original.createdAt,JSON.stringify(original));let calls=0;
  const result=await enrichEnglish({ids:[original.id]},async<T>()=>{calls++;updateEnglishCard({id:original.id,favorite:true});return {cards:[metadata]} as T;});
  const card=result.cards[0];assert.equal(card.favorite,true);assert.equal(card.number,65);assert.deepEqual(card.examples,original.examples);assert.equal(card.query,original.query);assert.equal(card.partOfSpeech,'adj.');assert.equal(card.chunk?.english,metadata.chunk.english);
  await enrichEnglish({ids:[original.id]},async()=>{throw Error('Already enriched');});assert.equal(calls,1);
});
test('invalid batch metadata cannot mutate cards or invent a part of speech',async()=>{
  const legacy={...original,id:'invalid'};db.prepare('INSERT INTO english_cards VALUES(?,?,?,?)').run(legacy.id,legacy.id,legacy.createdAt,JSON.stringify(legacy));const before=englishCards();
  for(const patch of [{...metadata,id:legacy.id,partOfSpeech:'guessed'},{...metadata,id:legacy.id,chunk:{english:'desensitized',chinese:'孤立单词'}},{...metadata,id:'wrong'}]){await assert.rejects(enrichEnglish({ids:[legacy.id]},async<T>()=>({cards:[patch]}) as T));assert.deepEqual(englishCards(),before);}
});
