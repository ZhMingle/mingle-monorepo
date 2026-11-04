import {useMemo} from 'react';
import {readableGitScenario} from '../shared/git-scenario.ts';
import CodeBlock from './CodeBlock.tsx';
import LearningText from './LearningText.tsx';
import {useLanguage} from './language.tsx';
import {usePresentation} from './usePresentation.ts';
import './git-scenario.css';

export default function GitScenario({source}:{source:string}){
  const {language}=useLanguage();const say=(en:string,zh:string)=>language==='zh'?zh:en;
  const parsed=useMemo(()=>readableGitScenario(source),[source]);
  const {view,translationError,retryTranslation}=usePresentation(parsed,language);
  if(!view)return <CodeBlock code={source} language="text" pathId="git" label={say('Repository state and commands','仓库状态与命令')}/>;
  return <div className="git-scenario">
    {view.initial.length>0&&<section className="git-initial"><h3>{say('Starting state','初始状态')}</h3><ul>{view.initial.map((line,i)=><li key={i}><LearningText text={line.scenario}/></li>)}</ul></section>}
    {view.introduction.map((line,i)=><LearningText key={i} text={line.scenario}/>)}
    <h3>{say('Actions in order','操作顺序')}</h3>
    <ol className="git-timeline">{view.steps.map((step,i)=><li key={i}><span className="git-step-number" aria-hidden="true">{i+1}</span><div>{step.code!==undefined?<><small>{say('Command','运行命令')}</small><pre><code>{step.code}</code></pre></>:<LearningText text={step.scenario}/>}</div></li>)}</ol>
    {translationError&&<p role="alert">{say('Translation could not finish.','说明翻译未完成。')} <button onClick={retryTranslation}>{say('Retry','重试')}</button></p>}
  </div>;
}
