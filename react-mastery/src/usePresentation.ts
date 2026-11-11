import { useEffect, useState } from 'react';
import { presentationStrings,presentationIdentifiers,presentationBatches, present } from '../shared/presentation.ts';
import { request } from './api.ts';

const cache=new Map<string,Record<string,string>>();
const pending=new Map<string,Promise<Record<string,string>>>();
async function translate(texts:string[],language:'en'|'zh',identifiers:string[]){
  const result:Record<string,string>={};
  for(const batch of presentationBatches(texts))Object.assign(result,await request<Record<string,string>>('presentation',{texts:batch,language,identifiers}));
  return result;
}
export function usePresentation<T>(payload:T|null,language:'en'|'zh'){
  const texts=presentationStrings(payload);
  const identifiers=presentationIdentifiers(payload);
  const key=JSON.stringify([language,texts,identifiers]);
  const [languageChange,setLanguageChange]=useState({language,key:''});
  // Tie the switch notice to this request, not later background wording updates.
  if(languageChange.language!==language)setLanguageChange({language,key});
  const [,refresh]=useState(0);const [failure,setFailure]=useState<{key:string;message:string}|null>(null);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    if(!payload||!texts.length||cache.has(key))return;
    let current=true;
    let task=pending.get(key);
    if(!task){task=translate(texts,language,identifiers);pending.set(key,task);void task.finally(()=>pending.delete(key)).catch(()=>{});}
    void task.then(result=>{cache.set(key,result);if(current){setFailure(null);refresh(v=>v+1);}}).catch(e=>{if(current)setFailure({key,message:e.message});});
    return()=>{current=false;};
  },[key,retry]);
  const translations=cache.get(key);
  const translating=!!payload&&texts.length>0&&!translations&&failure?.key!==key;
  const switchingLanguage=translating&&(languageChange.language!==language||languageChange.key===key);
  return {view:payload&&translations?present(payload,translations):payload,translating,switchingLanguage,translationError:failure?.key===key?failure.message:'',retryTranslation:()=>{setFailure(null);setRetry(v=>v+1);}};
}
