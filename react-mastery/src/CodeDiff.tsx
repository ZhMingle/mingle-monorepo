import {useMemo} from 'react';
import {codeChanges,characterChanges} from '../shared/code-diff.ts';
import type {ChangedRange} from '../shared/code-diff.ts';
import CodeBlock from './CodeBlock.tsx';
import {useLanguage} from './language.tsx';

export default function CodeDiff({before,after,language,pathId}:{before:string;after:string;language:string;pathId:string}){
  const {language:ui}=useLanguage();const say=(en:string,zh:string)=>ui==='zh'?zh:en;
  const hunks=useMemo(()=>codeChanges(before,after).map(lines=>{
    const ranges:ChangedRange[][]=lines.map(()=>[]);
    for(let i=0;i<lines.length;){
      if(lines[i].kind==='context'){i++;continue;}
      const removed:number[]=[],added:number[]=[];
      while(i<lines.length&&lines[i].kind!=='context'){(lines[i].kind==='remove'?removed:added).push(i++);}
      for(let j=0;j<Math.max(removed.length,added.length);j++){
        const r=removed[j],a=added[j];
        const chars=characterChanges(r===undefined?'':lines[r].text,a===undefined?'':lines[a].text);
        if(r!==undefined)ranges[r]=chars.before;
        if(a!==undefined)ranges[a]=chars.after;
      }
    }
    return {code:lines.map(line=>line.text).join('\n'),kinds:lines.map(line=>line.kind),ranges,labels:lines.map(line=>`${line.oldLine??'·'} → ${line.newLine??'·'}`),position:lines.find(line=>line.oldLine)?.oldLine??lines[0].newLine};
  }),[before,after]);
  if(!hunks.length)return <p className="tp-meta">{say('Your code matches the reference exactly. No changes to show.','你的代码与参考答案完全相同，没有需要展示的改动。')}</p>;
  return <div className="submission-diff"><p className="tp-meta">{say('Line numbers: yours → reference · − Remove · + Add · Strong highlights mark changed characters.','行号：你的代码 → 参考答案 · − 删除 · + 新增 · 深色高亮标出具体改动字符。')}</p>{hunks.map((hunk,i)=><section key={i}>
    <small>{say('Changed lines near ','修改位置：第 ')}{hunk.position}{say('',' 行')}</small>
    <CodeBlock code={hunk.code} language={language} pathId={pathId} label={say('Your code compared with reference','你的代码与参考答案对照')} diffKinds={hunk.kinds} diffRanges={hunk.ranges} lineLabels={hunk.labels}/>
  </section>)}</div>;
}
