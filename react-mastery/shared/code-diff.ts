import {displayCode} from './rich-text.ts';
export type DiffKind='context'|'add'|'remove';
export interface DiffLine {kind:DiffKind;text:string;oldLine?:number;newLine?:number}
export interface ChangedRange {from:number;to:number}
// UTF-16 offsets match CodeMirror positions. Bound the character matrix too.
export function characterChanges(before:string,after:string):{before:ChangedRange[];after:ChangedRange[]} {
  let prefix=0,suffix=0;
  while(prefix<before.length&&prefix<after.length&&before[prefix]===after[prefix])prefix++;
  while(suffix<before.length-prefix&&suffix<after.length-prefix&&before[before.length-1-suffix]===after[after.length-1-suffix])suffix++;
  const a=before.slice(prefix,before.length-suffix),b=after.slice(prefix,after.length-suffix);
  const result:{before:ChangedRange[];after:ChangedRange[]}={before:[],after:[]};
  const add=(ranges:ChangedRange[],at:number)=>{const last=ranges.at(-1);if(last?.to===at)last.to++;else ranges.push({from:at,to:at+1});};
  if((a.length+1)*(b.length+1)>250000){
    if(a.length)result.before.push({from:prefix,to:prefix+a.length});
    if(b.length)result.after.push({from:prefix,to:prefix+b.length});
    return result;
  }
  const table=Array.from({length:a.length+1},()=>new Uint32Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)table[i][j]=a[i]===b[j]?table[i+1][j+1]+1:Math.max(table[i+1][j],table[i][j+1]);
  let i=0,j=0;
  while(i<a.length||j<b.length){
    if(i<a.length&&j<b.length&&a[i]===b[j]){i++;j++;}
    else if(i<a.length&&(j===b.length||table[i+1][j]>=table[i][j+1]))add(result.before,prefix+i++);
    else add(result.after,prefix+j++);
  }
  return result;
}
export function codeChanges(before:string,after:string,context=1):DiffLine[][] {
  const split=(source:string)=>displayCode(source).code.replace(/\r\n/g,'\n').split('\n');
  const a=split(before),b=split(after);let prefix=0,suffix=0;
  while(prefix<a.length&&prefix<b.length&&a[prefix]===b[prefix])prefix++;
  if(prefix===a.length&&prefix===b.length)return [];
  while(suffix<a.length-prefix&&suffix<b.length-prefix&&a[a.length-1-suffix]===b[b.length-1-suffix])suffix++;
  const n=a.length-prefix-suffix,m=b.length-prefix-suffix;
  const edits:{kind:DiffKind;text:string}[]=a.slice(0,prefix).map(text=>({kind:'context',text}));
  // Bound memory for unusually large generated code. A replacement remains
  // accurate, with less granular matching inside the changed middle section.
  if((n+1)*(m+1)>1_000_000){
    edits.push(...a.slice(prefix,a.length-suffix).map(text=>({kind:'remove' as const,text})),...b.slice(prefix,b.length-suffix).map(text=>({kind:'add' as const,text})));
  }else{
    const table=Array.from({length:n+1},()=>new Uint32Array(m+1));
    for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)table[i][j]=a[prefix+i]===b[prefix+j]?table[i+1][j+1]+1:Math.max(table[i+1][j],table[i][j+1]);
    let i=0,j=0;
    while(i<n||j<m){
      if(i<n&&j<m&&a[prefix+i]===b[prefix+j]){edits.push({kind:'context',text:a[prefix+i++]});j++;}
      else if(i<n&&(j===m||table[i+1][j]>=table[i][j+1]))edits.push({kind:'remove',text:a[prefix+i++]});
      else edits.push({kind:'add',text:b[prefix+j++]});
    }
  }
  edits.push(...a.slice(a.length-suffix).map(text=>({kind:'context' as const,text})));
  let oldLine=1,newLine=1;
  const lines:DiffLine[]=edits.map(line=>({...line,...(line.kind!=='add'?{oldLine:oldLine++}:{}),...(line.kind!=='remove'?{newLine:newLine++}:{})}));
  const visible=new Set<number>();
  lines.forEach((line,i)=>{if(line.kind!=='context')for(let j=Math.max(0,i-context);j<=Math.min(lines.length-1,i+context);j++)visible.add(j);});
  const hunks:DiffLine[][]=[];let previous=-2;
  for(const i of visible){if(i!==previous+1)hunks.push([]);hunks.at(-1)!.push(lines[i]);previous=i;}
  return hunks;
}
