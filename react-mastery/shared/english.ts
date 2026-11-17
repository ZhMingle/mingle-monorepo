export type EnglishPoint={
  term:string;
  kind:'word'|'expression';
  pronunciation:string;
  meaning:string;
  usage:string;
  examples:{english:string;chinese:string}[];
  pitfall:string;
  related:{term:string;meaning:string}[];
  partOfSpeech?:string;
  chunk?:{english:string;chinese:string};
  memory?:{association:string;sound:string;parts:string};
};
export type EnglishSource={input:string;english:string;chinese:string;note:string};
export type EnglishCard=EnglishPoint&{id:string;number:number;query:string;context:string;createdAt:string;favorite:boolean;sourceNote?:string;sources?:EnglishSource[]};
export const englishTermKey=(term:string)=>term.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
export const englishTitle=(card:EnglishPoint)=>card.chunk?.english??card.term;
export const englishMeaning=(card:EnglishPoint)=>card.chunk?.chinese??card.meaning;
export const englishExampleKey=(sentence:string)=>englishTermKey(sentence).replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[.!?…]+["')]*$/,'').trim();
export const englishPartsOfSpeech=['n.','v.','adj.','adv.','prep.','conj.','pron.','det.','interj.','phr.'];
export function validateEnglishChunk(raw:unknown){
  const value=raw as EnglishPoint;
  if(!value||!englishPartsOfSpeech.includes(value.partOfSpeech??'')||!value.chunk||typeof value.chunk.english!=='string'||value.chunk.english.length>160||!value.chunk.english.trim().includes(' ')||typeof value.chunk.chinese!=='string'||!value.chunk.chinese.trim()||value.chunk.chinese.length>160)throw new Error('AI 返回的词性或常用语块不完整，请重试。');
  return {partOfSpeech:value.partOfSpeech!,chunk:{english:value.chunk.english.trim(),chinese:value.chunk.chinese.trim()}};
}
export const englishMemorySchema={type:'object',additionalProperties:false,properties:{association:{type:'string',minLength:1,maxLength:300},sound:{type:'string',maxLength:300},parts:{type:'string',maxLength:300}},required:['association','sound','parts']};
export function validateEnglishMemory(raw:unknown):NonNullable<EnglishPoint['memory']>{
  const value=raw as NonNullable<EnglishPoint['memory']>;
  if(!value||typeof value.association!=='string'||!value.association.trim()||[value.association,value.sound,value.parts].some(value=>typeof value!=='string'||value.length>300))throw new Error('AI 返回的速记提示不完整，请重试。');
  return {association:value.association,sound:value.sound,parts:value.parts};
}
export function hasEnglishLearning(card:EnglishPoint){try{validateEnglishChunk(card);validateEnglishMemory(card.memory);return true;}catch{return false;}}

export function englishBatchInput(value:string,context=''){
  if(value.length>10000)throw new Error('一次输入最多 10000 个字符。');
  // A punctuated sentence keeps its internal semicolons; word lists still split.
  const queries=value.split(/\r?\n/).flatMap(line=>/[.!?…]["'’”)]?\s*$/.test(line)?[line]:line.split(/[;；]+/)).map(query=>query.trim()).filter(Boolean);
  if(!queries.length)throw new Error('请输入单词或表达，每行一个，或用分号分隔。');
  const unique=new Map<string,ReturnType<typeof englishInput>>();
  for(const query of queries){const item=englishInput({query,context});unique.set(item.key,item);}
  if(unique.size>50)throw new Error('一次最多生成 50 张卡片，请分批输入。');
  return [...unique.values()];
}

export function englishInput(input:Record<string,unknown>){
  if(typeof input.query!=='string'||!input.query.trim()||input.query.length>300)throw new Error('每项请输入 1–300 个字符的单词、短语或英文原句。');
  if(input.context!==undefined&&(typeof input.context!=='string'||input.context.length>500))throw new Error('语境最多 500 个字符。');
  const query=input.query.trim().replace(/\s+/g,' ');
  const context=((input.context??'') as string).trim();
  return {query,context,key:JSON.stringify([query.normalize('NFKC').toLowerCase(),context.normalize('NFKC')])};
}
export function validateEnglishPoint(raw:unknown):EnglishPoint{
  const value=raw as EnglishPoint;
  const string=(v:unknown,max:number,empty=false)=>typeof v==='string'&&v.length<=max&&(empty||!!v.trim());
  if(!value||!string(value.term,160)||!['word','expression'].includes(value.kind)||!string(value.pronunciation,160,true)||!string(value.meaning,160)||!string(value.usage,300)||!string(value.pitfall,300)
    ||!Array.isArray(value.examples)||value.examples.length!==2||value.examples.some(e=>!e||!string(e.english,300)||!string(e.chinese,300))
    ||!Array.isArray(value.related)||value.related.length>3||value.related.some(e=>!e||!string(e.term,160)||!string(e.meaning,160)))throw new Error('AI 返回的知识卡片不完整，请重试。');
  return {term:value.term,kind:value.kind,pronunciation:value.pronunciation,meaning:value.meaning,usage:value.usage,examples:value.examples.map(e=>({english:e.english,chinese:e.chinese})),pitfall:value.pitfall,related:value.related.map(e=>({term:e.term,meaning:e.meaning})),...validateEnglishChunk(value),memory:validateEnglishMemory(value.memory)};
}
