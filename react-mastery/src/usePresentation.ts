import { useEffect, useState } from 'react';
import { presentationStrings, present } from '../shared/presentation.ts';
import { request } from './api.ts';

const cache=new Map<string,Record<string,string>>();
const pending=new Map<string,Promise<Record<string,string>>>();
async function translate(texts:string[],language:'en'|'zh'){
  const result:Record<string,string>={};let batch:string[]=[];let size=0;
  async function flush(){if(batch.length)Object.assign(result,await request<Record<string,string>>('presentation',{texts:batch,language}));batch=[];size=0;}
  for(const text of texts){const length=JSON.stringify(text).length;if(size+length>60000||batch.length>=100)await flush();batch.push(text);size+=length;}
  await flush();return result;
}
export function usePresentation<T>(payload:T|null,language:'en'|'zh'){
  const texts=presentationStrings(payload);
  const key=JSON.stringify([language,texts]);
  const [version,refresh]=useState(0);const [failure,setFailure]=useState<{key:string;message:string}|null>(null);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    if(!payload||!texts.length||cache.has(key))return;
    let current=true;
    let task=pending.get(key);
    if(!task){task=translate(texts,language);pending.set(key,task);void task.finally(()=>pending.delete(key)).catch(()=>{});}
    void task.then(result=>{cache.set(key,result);if(current){setFailure(null);refresh(v=>v+1);}}).catch(e=>{if(current)setFailure({key,message:e.message});});
    return()=>{current=false;};
  },[key,retry]);
  // Warm the other language after the current presentation is ready.
  useEffect(()=>{
    if(!payload||!texts.length||!cache.has(key))return;
    const other=language==='zh'?'en':'zh';const otherKey=JSON.stringify([other,texts]);
    if(cache.has(otherKey)||pending.has(otherKey))return;
    const task=translate(texts,other);pending.set(otherKey,task);
    void task.then(result=>{cache.set(otherKey,result);}).catch(()=>{}).finally(()=>pending.delete(otherKey));
  },[key,version]);
  const translations=cache.get(key);
  return {view:payload&&translations?present(payload,translations):payload,translating:!!payload&&texts.length>0&&!translations&&failure?.key!==key,translationError:failure?.key===key?failure.message:'',retryTranslation:()=>{setFailure(null);setRetry(v=>v+1);}};
}
