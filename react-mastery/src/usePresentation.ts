import { useEffect, useState } from 'react';
import { presentationStrings,presentationIdentifiers, present } from '../shared/presentation.ts';
import { request } from './api.ts';
import {PresentationCache} from './presentation-cache.ts';

const presentations=new PresentationCache((texts,language,identifiers,background)=>request<Record<string,string>>('presentation',{texts,language,identifiers,background}));
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
    if(!payload||!texts.length)return;
    let current=true;
    void presentations.prepare(payload,language).then(()=>{if(current){setFailure(null);refresh(v=>v+1);}}).catch(e=>{if(current)setFailure({key,message:e.message});});
    let timer:ReturnType<typeof setTimeout>|undefined;
    async function warm(attempt=0){try{await presentations.prepare(payload,language==='zh'?'en':'zh',true);}catch{if(current&&attempt<2)timer=setTimeout(()=>void warm(attempt+1),5000*(attempt+1));}}
    void warm();
    return()=>{current=false;if(timer)clearTimeout(timer);};
  },[key,retry]);
  const translations=presentations.get(payload,language);
  const translating=!!payload&&texts.length>0&&!translations&&failure?.key!==key;
  const switchingLanguage=translating&&(languageChange.language!==language||languageChange.key===key);
  return {view:payload&&translations?present(payload,translations):payload,translating,switchingLanguage,translationError:failure?.key===key?failure.message:'',retryTranslation:()=>{setFailure(null);setRetry(v=>v+1);}};
}
