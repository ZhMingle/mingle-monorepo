import {displayCode} from '../shared/rich-text.ts';
import {codeFlavor,formatSource} from './code-format.ts';

// Presentation only. Never change the starter, draft, or stored reference.
export async function referenceComparison(starter:string,reference:string,language:string,pathId:string){
  let before=displayCode(starter).code,after=displayCode(reference).code;
  const flavor=codeFlavor(language,pathId);
  let formatted=false;
  try{
    const pair=await Promise.all([formatSource(before,flavor),formatSource(after,flavor)]);
    [before,after]=pair;formatted=true;
  }catch{/* Invalid starter syntax is normal in repair tasks. Keep both originals. */}
  let preservedSetup=false;
  if(['mysql','postgresql','tsql'].includes(flavor)){
    // A query-only answer does not ask the learner to delete supplied schema.
    // Limit this to a leading CREATE TABLE setup followed by one SELECT/WITH.
    const query=/^(?:SELECT|WITH)\b/im.exec(before);
    const answer=after.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/,'');
    if(query&&/^(?:SELECT|WITH)\b/i.test(answer)){
      const prefix=before.slice(0,query.index);
      if(/^\s*CREATE\s+TABLE\b/i.test(prefix)&&! /\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i.test(prefix)){
        after=prefix+answer;preservedSetup=true;
      }
    }
  }
  return {before:before.trimEnd(),after:after.trimEnd(),formatted,preservedSetup};
}
