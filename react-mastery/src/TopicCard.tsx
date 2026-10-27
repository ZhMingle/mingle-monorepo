import {CheckCircle2,Circle,CircleDot,ChevronRight} from 'lucide-react';
import type {TopicProgress} from '../shared/learning-progress.ts';
import type {PathTopic} from '../shared/path-types.ts';
import {useLanguage} from './language.tsx';

export function TopicCard({topic,pathId,progress}:{topic:PathTopic;pathId:string;progress?:TopicProgress}){
  const {language}=useLanguage();const say=(en:string,zh:string)=>language==='zh'?zh:en;
  const status=!progress?'unknown':progress.completed>=progress.total?'complete':progress.started||progress.completed>0?'active':'pending';
  const Icon=status==='complete'?CheckCircle2:status==='active'?CircleDot:Circle;
  const label=status==='complete'?say('Completed','已完成'):status==='active'?say('In progress','进行中'):status==='pending'?say('Not started','未开始'):say('Syncing progress','进度待同步');
  return <details className={`topic-status-row topic-${status}`} data-status={status}>
    <summary><Icon className="topic-status-icon" size={22} aria-hidden="true"/><span className="topic-status-title">{topic.title[language]}</span><span className="topic-status-badge"><strong>{label}</strong>{progress&&<span>{progress.completed}/{progress.total}</span>}</span><ChevronRight className="topic-disclosure" size={18} aria-hidden="true"/></summary>
    <div><p>{topic.goal[language]}</p>
      {progress&&<div className="topic-check-status">{(['choice','code'] as const).map(kind=><span key={kind} className={progress.kinds.includes(kind)?'passed':'waiting'}>{progress.kinds.includes(kind)?'✓':'○'} {kind==='choice'?say('Choice','选择题'):say('Code','代码题')} · {progress.kinds.includes(kind)?say('Passed','已通过'):say('To do','待完成')}</span>)}</div>}
      <p className="path-check"><strong>{say('Test your understanding','验证理解')}</strong>{topic.check[language]}</p>
      <a href={topic.source} target="_blank" rel="noreferrer">{say('Read the source ↗','阅读官方资料 ↗')}</a><a className="path-topic-start" href={`#roadmap/${pathId}/${topic.id}`}>{status==='complete'?say('Review topic →','复习此知识点 →'):status==='active'?say('Continue learning →','继续学习 →'):say('Start learning →','开始学习 →')}</a>
    </div>
  </details>;
}
