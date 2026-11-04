import {useMemo} from 'react';
import {codeChanges} from '../shared/code-diff.ts';
import CodeBlock from './CodeBlock.tsx';
import {useLanguage} from './language.tsx';

export default function CodeDiff({before,after,language,pathId}:{before:string;after:string;language:string;pathId:string}){
  const {language:ui}=useLanguage();const say=(en:string,zh:string)=>ui==='zh'?zh:en;
  const hunks=useMemo(()=>codeChanges(before,after).map(lines=>({code:lines.map(line=>line.text).join('\n'),kinds:lines.map(line=>line.kind),position:lines.find(line=>line.newLine)?.newLine??lines[0].oldLine})),[before,after]);
  if(!hunks.length)return <p className="tp-meta">{say('No code changes.','代码没有改动。')}</p>;
  return <div className="submission-diff"><p className="tp-meta">{say('− Removed · + Added','− 删除 · + 新增')}</p>{hunks.map((hunk,i)=><section key={i}>
    <small>{say('Changed lines near ','修改位置：第 ')}{hunk.position}{say('',' 行')}</small>
    <CodeBlock code={hunk.code} language={language} pathId={pathId} label={say('Code changes','代码改动')} diffKinds={hunk.kinds}/>
  </section>)}</div>;
}
