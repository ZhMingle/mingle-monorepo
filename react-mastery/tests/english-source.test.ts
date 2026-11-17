import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sourceExample,withSourceExample,repairLegacySource} from '../server/english-source.ts';
import type {EnglishCard} from '../shared/english.ts';
const card:EnglishCard={id:'source-fixture',number:65,term:'desensitized',kind:'word',pronunciation:'',meaning:'不那么敏感的。',usage:'形容逐渐适应刺激。',examples:[{english:'desensitized he need to be desensitized',chinese:'重复错误。'},{english:'He is desensitized to the noise.',chinese:'他习惯了噪声。'}],pitfall:'注意 to。',related:[],favorite:true,query:'desensitized he need to be desensitized',context:'',createdAt:'2026-11-17'};
test('reported prefix repair changes only the malformed example and is idempotent',()=>{
  const fixed=repairLegacySource(card);assert.equal(fixed.examples[0].english,'He needs to be desensitized.');assert.equal(fixed.examples[0].chinese,'他需要逐渐适应，变得不那么敏感。');
  for(const key of ['id','number','favorite','query','createdAt','pitfall'] as const)assert.equal(fixed[key],card[key]);
  assert.deepEqual(fixed.examples[1],card.examples[1]);assert.equal(repairLegacySource(fixed),fixed);
  const intentional={...card,examples:[{english:'Desensitized by the news, he stopped reacting.',chinese:'他麻木了。'}]};assert.equal(repairLegacySource(intentional),intentional);
});
test('corrected source wins over punctuation duplicates, and unexplained changes cannot be saved',()=>{
  const original='desensitized he need to be desensitized';
  const source=sourceExample({inputKind:'sentence',sourceSentence:'He needs to be desensitized.',sourceTranslation:'他需要变得不那么敏感。',sourceCorrection:'去掉重复词头；he need 改为 he needs。'},original);
  const fixed=withSourceExample({...card,examples:[{english:'he needs to be desensitized',chinese:'旧翻译。'},card.examples[1]]},source);
  assert.equal(fixed.examples.length,2);assert.equal(fixed.examples[0].english,source?.english);assert.equal(fixed.examples[0].chinese,source?.chinese);assert.match(fixed.sourceNote!,/he needs/);
  assert.throws(()=>sourceExample({inputKind:'sentence',sourceSentence:'A different sentence.',sourceTranslation:'完全不同。',sourceCorrection:''},original),/未说明/);
});
