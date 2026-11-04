export type TextBlock={kind:'code';text:string;language:string}|{kind:'paragraph'|'heading';text:string}|{kind:'list';items:string[];ordered:boolean};
// Older lessons may store either raw source or explanatory prose in example.
// Prefer normal text unless the first meaningful line clearly starts source.
export function isSourceExample(text:string):boolean {
  if(/(?:^|\n)\s*```/.test(text))return false;
  const first=text.split(/\r?\n/).map(line=>line.trim()).find(line=>line&&!/^(?:\/\/|#\s|\/\*|\*)/.test(line))??'';
  return /^(?:(?:import|export|const|let|var|function|async|class|interface|type|def|from|package|func|public|private|namespace|using|return)\b|(?:SELECT|WITH|CREATE|INSERT|UPDATE|DELETE|ALTER)\b|[{}\[]|<[A-Za-z/!]|[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\s*\(|[.#][\w-]+\s*\{)/.test(first);
}
// Some saved code-only fields contain one Markdown wrapper. Remove only that
// wrapper for display, keeping raw source and learner drafts untouched.
export function displayCode(source:string):{code:string;language:string}{
  const fence=/^\s*```([^`\r\n]*)\r?\n([\s\S]*?)\r?\n```\s*$/.exec(source);
  return fence?{code:fence[2],language:fence[1].trim()}:{code:source,language:''};
}
export function textBlocks(text:string):TextBlock[]{
  const lines=text.replace(/\r\n/g,'\n').split('\n');const blocks:TextBlock[]=[];
  for(let i=0;i<lines.length;){
    const line=lines[i];
    if(!line.trim()){i++;continue;}
    const fence=/^\s*```([^`]*)$/.exec(line);
    if(fence){
      const code:string[]=[];i++;
      while(i<lines.length&&!/^\s*```\s*$/.test(lines[i]))code.push(lines[i++]);
      if(i<lines.length)i++;
      blocks.push({kind:'code',text:code.join('\n'),language:fence[1].trim()});continue;
    }
    const heading=/^\s*#{1,6}\s+(.+)$/.exec(line);
    if(heading){blocks.push({kind:'heading',text:heading[1]});i++;continue;}
    const item=/^\s*(?:([-*])|\d+[.)])\s+(.+)$/.exec(line);
    if(item){
      const items:string[]=[];const ordered=!item[1];
      while(i<lines.length){const next=/^\s*(?:([-*])|\d+[.)])\s+(.+)$/.exec(lines[i]);if(!next||!next[1]!==ordered)break;items.push(next[2]);i++;}
      blocks.push({kind:'list',items,ordered});continue;
    }
    const paragraph=[line];i++;
    while(i<lines.length&&lines[i].trim()&&!/^\s*(?:```|#{1,6}\s|[-*]\s|\d+[.)]\s)/.test(lines[i]))paragraph.push(lines[i++]);
    blocks.push({kind:'paragraph',text:paragraph.join('\n')});
  }
  return blocks;
}
export function inlineParts(text:string):{kind:'text'|'code'|'strong';text:string}[]{
  return text.split(/(`[^`\n]+`|\*\*[^*]+\*\*)/g).filter(Boolean).map(part=>
    part.startsWith('`')?{kind:'code',text:part.slice(1,-1)}:part.startsWith('**')?{kind:'strong',text:part.slice(2,-2)}:{kind:'text',text:part});
}
