import {useEffect,useMemo,useState} from 'react';
import {referenceComparison} from './reference-comparison.ts';
import {codeChanges,characterChanges} from '../shared/code-diff.ts';
import type {ChangedRange} from '../shared/code-diff.ts';
import CodeBlock from './CodeBlock.tsx';
import {useLanguage} from './language.tsx';

export default function CodeDiff({before,after,language,pathId}:{before:string;after:string;language:string;pathId:string}){
  const {language:ui}=useLanguage();const say=(en:string,zh:string)=>ui==='zh'?zh:en;
  const key=JSON.stringify([before,after,language,pathId]);
  const [comparison,setComparison]=useState<Awaited<ReturnType<typeof referenceComparison>>&{key:string}|null>(null);
  useEffect(()=>{let live=true;void referenceComparison(before,after,language,pathId).then(result=>{if(live)setComparison({...result,key});});return()=>{live=false;};},[key]);
  const hunks=useMemo(()=>codeChanges(comparison?.before??'',comparison?.after??'',Number.MAX_SAFE_INTEGER).map(lines=>{
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
  }),[comparison]);
  if(comparison?.key!==key)return <p role="status">{say('Preparing changes…','正在整理修改点…')}</p>;
  if(!hunks.length)return <><p className="tp-meta">{say('The starter already matches the reference after formatting.','统一格式后，题目初始代码与参考答案一致。')}</p><CodeBlock code={comparison.after} language={language} pathId={pathId} label={say('Complete reference code','完整参考代码')}/></>;
  return <div className="submission-diff"><p className="tp-meta">{say('− Original task code · + Reference change · Strong highlights mark the exact characters to change.','− 题目原代码 · + 参考修改 · 深色高亮标出要改的具体字符。')}</p>{comparison.formatted&&<p className="tp-meta">{say('Both sides use the same formatting; line numbers refer to this formatted comparison.','两侧已统一排版，行号对应此处排版后的代码。')}</p>}{comparison.preservedSetup&&<p className="tp-meta">{say('Keep the supplied table setup; only the query changes below.','题目提供的建表代码保留，只需修改下面的查询。')}</p>}{hunks.map((hunk,i)=><section key={i}>
    <strong>{say('Complete code with changes','完整代码与修改标记')}</strong>
    <CodeBlock code={hunk.code} language={language} pathId={pathId} label={say('Starter code and reference changes','题目原代码与参考修改')} diffKinds={hunk.kinds} diffRanges={hunk.ranges} lineLabels={hunk.labels}/>
  </section>)}<details><summary>{say('View complete final code without diff markers','查看修改后的完整代码（无差异标记）')}</summary><CodeBlock code={comparison.after} language={language} pathId={pathId} label={say('Complete reference code','完整参考代码')}/></details></div>;
}
