// Only authored prose is translated. Code, learner evidence, identifiers and scores
// remain byte-for-byte identical; option positions are never changed.
const prose=new Set(['overview','pitfall','exampleExplanation','scenario','question','options','choices','requirements','expected','feedback','issues','reason','misconception','misconceptions','summary','nextStep','followUp','detail','name','brief','criteria','explanation','prompt']);
export function presentationStrings(value:unknown):string[]{
  const result=new Set<string>();
  visit(value,[],(text)=>{if(text.trim())result.add(text);return text;});
  return [...result];
}
function visit(value:unknown,path:string[],map:(text:string)=>string):unknown {
  if(typeof value==='string'){
    const key=path.at(-1)!;
    const inDraft=path.includes('draft')||path.includes('drafts');
    const learnerReason=(key==='reason'&&!path.includes('cases'))||(key==='explanation'&&path.includes('attempts'));
    const reference=path.includes('references')&&key!=='code';
    return !inDraft&&!learnerReason&&(prose.has(key)||reference)?map(value):value;
  }
  if(Array.isArray(value))return value.map(item=>visit(item,path,map));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,visit(item,[...path,key],map)]));
  return value;
}
export function present<T>(value:T,translations:Record<string,string>):T {
  return visit(value,[],text=>translations[text]??text) as T;
}
