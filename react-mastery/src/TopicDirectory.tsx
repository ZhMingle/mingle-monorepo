import {useEffect,useId,useRef,useState} from 'react';
import type {LearningPath} from '../shared/path-types.ts';
import type {TopicProgress} from '../shared/learning-progress.ts';
import {useLanguage} from './language.tsx';
import './topic-directory.css';

export default function TopicDirectory({path,current,progress,disabled,onNavigate,docked=false}:{path:LearningPath;current:string;progress:Record<string,TopicProgress>;disabled:boolean;docked?:boolean;onNavigate:(id:string)=>void}){
  const panelId=useId();
  const {language}=useLanguage();const say=(en:string,zh:string)=>language==='zh'?zh:en;
  const [open,setOpen]=useState(false);const [query,setQuery]=useState('');
  const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);const search=useRef<HTMLInputElement>(null);
  const stages={foundation:say('Foundations','基础'),practice:say('Practice','实践'),advanced:say('Advanced','进阶')};
  const topics=path.stages.flatMap(stage=>stage.topics);
  const matches=(title:{en:string;zh:string})=>`${title.en} ${title.zh}`.toLowerCase().includes(query.trim().toLowerCase());
  useEffect(()=>{
    if(!open||docked)return;
    search.current?.focus();
    const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[open,docked]);
  return <div className={`topic-directory ${docked?'topic-directory-docked':'topic-directory-floating'}`} ref={root}>
    {!docked&&<button ref={trigger} type="button" disabled={disabled} aria-expanded={open} aria-controls={panelId} onClick={()=>{setQuery('');setOpen(!open);}}>{say('Contents','目录')} · {path.name[language]} <span aria-hidden="true">{open?'▴':'▾'}</span></button>}
    {(open||docked)&&<div id={panelId} className="topic-directory-panel">
      <div className="topic-directory-heading"><strong>{docked?path.name[language]:say('Module contents','模块目录')}</strong>{!docked&&<button type="button" aria-label={say('Close contents','关闭目录')} onClick={()=>{setOpen(false);trigger.current?.focus();}}>×</button>}</div>
      <input ref={search} type="search" aria-label={say('Search topics','搜索知识点')} placeholder={say('Search topics…','搜索知识点…')} value={query} onChange={event=>setQuery(event.target.value)}/>
      <div className="topic-directory-list">
        {path.stages.map(stage=>{const items=stage.topics.filter(item=>matches(item.title));return items.length>0&&<section key={stage.id}><h2>{stages[stage.id]}</h2><ol>{items.map(item=>{
          const value=progress[item.id];
          const status=value?`${value.completed}/${value.total}`:'—';
          return <li key={item.id}><button type="button" disabled={disabled} aria-current={item.id===current?'page':undefined} onClick={()=>{if(item.id!==current)onNavigate(item.id);setOpen(false);trigger.current?.focus();}}><span className="topic-directory-number">{topics.findIndex(topic=>topic.id===item.id)+1}</span><span>{item.title[language]}</span><small>{item.id===current?say('Current','当前'):status}</small></button></li>;
        })}</ol></section>;})}
        {!topics.some(item=>matches(item.title))&&<p role="status">{say('No matching topics','没有匹配的知识点')}</p>}
      </div>
    </div>}
  </div>;
}
