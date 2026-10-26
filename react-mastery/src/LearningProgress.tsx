import { useCallback, useEffect, useRef, useState } from 'react';
import type { LearningOverview,ProgressSummary } from '../shared/learning-progress.ts';
import { findLearningPath } from '../shared/paths.ts';
import { request } from './api.ts';
import { useLanguage } from './language.tsx';
import './learning-progress.css';

export function useLearningOverview(route:string){
  const [overview,setOverview]=useState<LearningOverview|null>(null);const [error,setError]=useState('');
  const mounted=useRef(false);const sequence=useRef(0);
  const reload=useCallback(()=>{
    const key=++sequence.current;
    void request<LearningOverview>('study/overview',{}).then(result=>{if(mounted.current&&key===sequence.current){setOverview(result);setError('');}}).catch(e=>{if(mounted.current&&key===sequence.current)setError(e.message);});
  },[]);
  useEffect(()=>{mounted.current=true;reload();return()=>{mounted.current=false;sequence.current++;};},[route,reload]);
  return {overview,error,reload};
}
export function ProgressMeter({value,label}:{value:ProgressSummary;label:string}){
  const {language}=useLanguage();
  return <div className="learning-meter"><div><strong>{label}</strong><span>{value.completedChecks}/{value.totalChecks} · {value.percent}%</span></div><progress aria-label={label} value={value.completedChecks} max={value.totalChecks||1}/><small>{language==='zh'?`${value.completedTopics}/${value.totalTopics} 个知识点完成`:`${value.completedTopics}/${value.totalTopics} topics complete`}</small></div>;
}
export function LearningProgress({overview,pathId,error,onRetry}:{overview:LearningOverview|null;pathId?:string;error?:string;onRetry:()=>void}){
  const {language}=useLanguage();const say=(en:string,zh:string)=>language==='zh'?zh:en;
  const path=pathId?findLearningPath(pathId):null;
  return <section className="learning-progress" aria-label={say('Learning progress','学习进度')}>
    {error?<p role="alert">{say('Progress could not update.','进度暂时无法更新。')} <button onClick={onRetry}>{say('Retry','重试')}</button></p>:!overview?<p role="status">{say('Loading progress…','正在读取进度…')}</p>:<>
      {path&&overview.paths[path.id]&&<ProgressMeter value={overview.paths[path.id]} label={`${path.name[language]} · ${say('path progress','路线进度')}`}/>}
      <ProgressMeter value={overview.overall} label={say('All available paths','全部已上线路线')}/>
      <p>{say('Practice completion: choice + code. Includes earlier successful attempts; not a mastery or curriculum coverage score.','练习完成度：选择题 + 代码题，保留历次通过结果；不代表掌握程度或全部知识覆盖率。')}</p>
    </>}
  </section>;
}
