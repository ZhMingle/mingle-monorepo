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
  wordFormation?:EnglishWordFormation;
};
export type EnglishWordFormation={etymology:string;root:string;affixes:string;soundOrigin?:string;meaningConnection?:string};
export const englishWordFormationFields=['etymology','root','affixes','soundOrigin','meaningConnection'] as const;
export function validateEnglishWordFormation(raw:unknown):EnglishWordFormation{
  const value=raw as EnglishWordFormation;
  if(!value||englishWordFormationFields.some(key=>typeof value[key]!=='string'||value[key].length>300))throw new Error('AI 返回的词源或构词信息不完整，请重试。');
  return Object.fromEntries(englishWordFormationFields.map(key=>[key,value[key]!.trim()])) as EnglishWordFormation;
}
export type EnglishSource={input:string;english:string;chinese:string;note:string};
export type EnglishLookupItem={query:string;context:string;comparison?:string[]};
export function needsEnglishPlan(items:EnglishLookupItem[]){
  const candidates=items.filter(item=>!item.comparison);
  return candidates.length>1||candidates.some(item=>/\s|[,，;；…]/.test(item.query));
}
export type EnglishCard=EnglishPoint&EnglishLookupItem&{id:string;number:number;createdAt:string;favorite:boolean;sourceNote?:string;sources?:EnglishSource[]};
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

function comparisonPair(query:string):string[]|undefined{
  const parts=query.split(/\s+vs\.?\s+/i).map(part=>part.trim());
  if(parts.length!==2||parts.some(part=>!part||/[,，;；!?]/.test(part)))return;
  parts[1]=parts[1].replace(/\.$/,'');
  if(parts[1]&&englishTermKey(parts[0])!==englishTermKey(parts[1]))return parts;
}

function batchLine(line:string):string[]{
  const entries=line.split(/[;；]+|\s+\/\s+/);
  // An explicit comparison marks a list even if the last entry is a complete sentence.
  const beforeComma=(entry:string)=>entry.split(/[,，]/,1)[0];
  if(!entries.some(entry=>comparisonPair(beforeComma(entry)))&&/[.!?…]["'’”)]?\s*$/.test(line))return [line];
  return entries.flatMap(entry=>{
    const parts:string[]=[];
    let remaining=entry;
    while(true){
      const first=beforeComma(remaining);
      if(first===remaining||!comparisonPair(first))break;
      parts.push(first);
      remaining=remaining.slice(first.length+1);
    }
    return [...parts,remaining];
  });
}

export function englishBatchInput(value:string,context=''){
  if(value.length>10000)throw new Error('一次输入最多 10000 个字符。');
  const queries=value.split(/\r?\n/).flatMap(batchLine).map(query=>query.trim()).filter(Boolean);
  if(!queries.length)throw new Error('请输入单词或表达，每行一个，或用分号分隔。');
  const unique=new Map<string,EnglishLookupItem>();
  for(const query of queries){
    const item=englishInput({query,context});
    const comparison=comparisonPair(item.query);
    unique.set(item.key,comparison?{...item,comparison}:item);
  }
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
