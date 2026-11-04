// Only authored prose is translated. Code, learner evidence, identifiers and scores
// remain byte-for-byte identical; option positions are never changed.
const prose=new Set(['overview','pitfall','exampleExplanation','scenario','question','options','choices','requirements','expected','feedback','issues','reason','misconception','misconceptions','summary','nextStep','followUp','detail','name','brief','criteria','explanation','prompt']);
export function codeTokens(text:string):string[]{return (text.match(/⟦CLARITY_CODE_+\d+⟧/g)??[]).sort();}
// Send the whole sentence, masking executable snippets rather than breaking its
// grammar into unrelated fragments around each inline code span.
export function mapProse(text:string,map:(text:string)=>string):string {
  if (/^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|GRANT|REVOKE|TRUNCATE)\b[\s\S]*;\s*$/i.test(text)) return text;
  let prefix='CLARITY_CODE_';while(text.includes(prefix))prefix+='_';
  const protectedCode:{token:string;source:string}[]=[];
  const masked=text.replace(/```[\s\S]*?```|`[^`\n]+`/g,source=>{
    const token=`⟦${prefix}${protectedCode.length}⟧`;protectedCode.push({token,source});return token;
  });
  if(!masked.replace(/⟦CLARITY_CODE_+\d+⟧/g,'').trim())return text;
  let translated=masked.replace(/^(\s*)([\s\S]*?)(\s*)$/,(_,before,prose,after)=>before+map(prose)+after);
  // An invalid response must never corrupt or remove code, including when
  // presented from a stale in-memory cache before the server validation runs.
  if(JSON.stringify(codeTokens(translated))!==JSON.stringify(codeTokens(masked)))return text;
  for(const {token,source} of protectedCode)translated=translated.replace(token,()=>source);
  return translated;
}
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
    return !inDraft&&!learnerReason&&(prose.has(key)||reference)?mapProse(value,map):value;
  }
  if(Array.isArray(value))return value.map(item=>visit(item,path,map));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,visit(item,[...path,key],map)]));
  return value;
}
export function present<T>(value:T,translations:Record<string,string>):T {
  return visit(value,[],text=>translations[text]??text) as T;
}
