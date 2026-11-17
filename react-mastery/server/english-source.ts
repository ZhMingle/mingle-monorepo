import {englishExampleKey,englishTermKey} from '../shared/english.ts';
import type {EnglishCard,EnglishPoint,EnglishSource} from '../shared/english.ts';

export function sourceExample(raw:unknown,query:string){
  const value=raw as {inputKind?:unknown;sourceSentence?:unknown;sourceTranslation?:unknown;sourceCorrection?:unknown};
  const string=(v:unknown)=>typeof v==='string'&&v.length<=300;
  if(!['word','expression','sentence'].includes(String(value.inputKind))||!string(value.sourceTranslation)||!string(value.sourceSentence)||!string(value.sourceCorrection)||value.inputKind==='sentence'&&(!(value.sourceTranslation as string).trim()||!(value.sourceSentence as string).trim()))throw new Error('AI 返回的原句信息不完整，请重试。');
  if(value.inputKind!=='sentence')return null;
  if(englishExampleKey(query)!==englishExampleKey(value.sourceSentence as string)&&!(value.sourceCorrection as string).trim())throw new Error('AI 未说明原句的修改，请重试。');
  return {english:(value.sourceSentence as string).trim(),chinese:(value.sourceTranslation as string).trim(),note:(value.sourceCorrection as string).trim()};
}
export function withSourceExample<T extends EnglishPoint>(point:T,source:ReturnType<typeof sourceExample>,input=source?.english??''):T&{sourceNote?:string;sources?:EnglishSource[]}{
  if(!source)return point;
  const example={english:source.english,chinese:source.chinese};
  const sources=[...((point as T&{sources?:EnglishSource[]}).sources??[]).filter(item=>englishTermKey(item.input)!==englishTermKey(input)),{input,...example,note:source.note}];
  return {...point,sources,examples:[example,...point.examples.filter(item=>englishExampleKey(item.english)!==englishExampleKey(example.english))],...(source.note?{sourceNote:source.note}:{})};
}
// Exact repair for the reported old source-import bug. The raw query stays intact.
export function repairLegacySource(card:EnglishCard):EnglishCard{
  if(englishTermKey(card.term)!=='desensitized')return card;
  const broken='desensitized he need to be desensitized';
  if(!card.examples.some(example=>englishExampleKey(example.english)===broken))return card;
  const source={english:'He needs to be desensitized.',chinese:'他需要逐渐适应，变得不那么敏感。',note:'原输入中的词头与句子重复；例句整理为 He needs to be desensitized.，并将 he need 修正为 he needs。'};
  const input=card.examples.find(example=>englishExampleKey(example.english)===broken)!.english;
  return withSourceExample({...card,examples:card.examples.filter(example=>englishExampleKey(example.english)!==broken)},source,input);
}
