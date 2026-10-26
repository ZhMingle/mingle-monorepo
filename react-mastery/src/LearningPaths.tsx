import TopicPractice from './TopicPractice.tsx';
import { request } from './api.ts';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { learningPaths, findLearningPath } from '../shared/paths.ts';
import { useLanguage } from './language.tsx';
import './learning-paths.css';

export function LearningPaths({reactRoadmap,reactTopicCount}:{reactRoadmap:ReactNode;reactTopicCount:number}) {
  const {language}=useLanguage();
  const say=(en:string,zh:string)=>language==='zh'?zh:en;
  const [selected,setSelected]=useState(()=>location.hash.split('/')[1]??'');
  const [topicId,setTopicId]=useState(()=>location.hash.split('/')[2]??'');
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('all');
  const [progress,setProgress]=useState<Record<string,{status:string}|null>>({});
  useEffect(()=>{const sync=()=>{setSelected(location.hash.split('/')[1]??'');setTopicId(location.hash.split('/')[2]??'');};window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
  const path=findLearningPath(selected);
  useEffect(()=>{
    let live=true;setProgress({});
    if(path?.mode==='topics')void request<{topics:Record<string,{status:string}|null>}>('topic/progress',{pathId:path.id}).then(result=>{if(live)setProgress(result.topics);}).catch(()=>{});
    return()=>{live=false;};
  },[selected,topicId]);
  const topic=path?.stages.flatMap(s=>s.topics).find(t=>t.id===topicId);
  if(path && topic)return <TopicPractice key={topic.id} topic={topic} pathId={path.id}/>;
  const stages={foundation:say('Foundations','基础'),practice:say('Practice','实践'),advanced:say('Advanced','进阶')};
  return <div className="learning-paths">
    {path ? <>
      <a className="path-back" href="#roadmap">← {say('All learning paths','全部学习路线')}</a>
      <div className="page-heading"><div><span className="eyebrow">{path.mode==='labs'?say('Interactive labs','交互练习'):say('Interactive topic practice','知识点交互练习')}</span><h1>{path.name[language]}</h1><p>{path.description[language]}</p></div></div>
      <div className="path-intro"><p><strong>{say('Before you start: ','学习前提：')}</strong>{path.prerequisite[language]}</p>{path.mode==='topics'&&<p>{say('Open any topic to learn from an example, predict an outcome, and explain a changed scenario. AI reviews your reasoning; code is not executed.','打开知识点即可看例子、判断结果，再解释条件变化。AI 反馈会保存在本机；此处不执行代码。')}</p>}<a href={path.source} target="_blank" rel="noreferrer">{say('Official documentation ↗','官方文档 ↗')}</a></div>
      {path.mode==='labs'?reactRoadmap:path.stages.map((stage,i)=><section className="path-stage" key={`${path.id}-${stage.id}`}><header><span>0{i+1}</span><h2>{stages[stage.id]}</h2></header><p className="path-project"><strong>{say('Milestone: ','阶段项目：')}</strong>{stage.project[language]}</p><div className="path-topics">{stage.topics.map(topic=><details key={topic.id}><summary>{topic.title[language]}{progress[topic.id]&&<span className="path-topic-progress">{progress[topic.id]?.status==='first-proof'?say('First evidence','初步理解'):progress[topic.id]?.status==='supported'?say('Completed with support','辅助完成'):say('In practice','练习中')}</span>}</summary><div><p>{topic.goal[language]}</p><p className="path-check"><strong>{say('Test your understanding','验证理解')}</strong>{topic.check[language]}</p><a href={topic.source} target="_blank" rel="noreferrer">{say('Read the source ↗','阅读官方资料 ↗')}</a><a className="path-topic-start" href={`#roadmap/${path.id}/${topic.id}`}>{say('Start / resume practice →','开始 / 继续练习 →')}</a></div></details>)}</div></section>)}
    </>:<>
      <div className="page-heading"><div><span className="eyebrow">{say('YOUR DEVELOPER PATHS','你的技术学习路线')}</span><h1>{say('Choose your next skill.','选择下一个技能。')}</h1><p>{say('Learn from a roadmap. Start where your knowledge gets uncertain.','按路线学习，也可以直接从不确定的知识点开始。')}</p></div></div>
      <div className="path-filters"><input aria-label={say('Search paths and topics','搜索路线与知识点')} placeholder={say('Search paths or topics…','搜索路线或知识点…')} value={query} onChange={e=>setQuery(e.target.value)}/><div>{[['all','All','全部'],['frontend','Frontend','前端'],['backend','Backend','后端'],['database','Databases','数据库']].map(([id,en,zh])=><button key={id} aria-pressed={category===id} onClick={()=>setCategory(id)}>{say(en,zh)}</button>)}</div></div>
      <div className="path-catalog">{learningPaths.filter(p=>(category==='all'||p.category===category)&&JSON.stringify([p.name,p.description,p.stages]).toLowerCase().includes(query.trim().toLowerCase())).map(p=><a key={p.id} className="path-card" href={`#roadmap/${p.id}`}><span className="path-mark">{p.mark}</span><h2>{p.name[language]}</h2><p>{p.description[language]}</p><span className="path-kind">{p.mode==='labs'?`${reactTopicCount} ${say('interactive labs','个交互练习')}`:`${p.stages.reduce((n,s)=>n+s.topics.length,0)} ${say('interactive topics','个交互知识点')}`}</span><strong>{say('Explore path →','查看路线 →')}</strong></a>)}</div>
      {!learningPaths.some(p=>(category==='all'||p.category===category)&&JSON.stringify([p.name,p.description,p.stages]).toLowerCase().includes(query.trim().toLowerCase()))&&<p role="status">{say('No matching paths. Try another topic.','没有匹配路线，请换个关键词。')}</p>}
    </>}
  </div>;
}
