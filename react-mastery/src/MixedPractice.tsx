import { runCode } from './sandbox.ts';
import { useEffect, useRef, useState } from 'react';
import { request } from './api.ts';
import { useLanguage } from './language.tsx';
import type { PathTopic } from '../shared/path-types.ts';
import { studyKinds } from '../shared/study.ts';
import type { StudyDraft,StudyKind,StudyPayload } from '../shared/study.ts';
import './topic-practice.css';

export default function MixedPractice({topic,pathId}:{topic:PathTopic;pathId:string}){
  const {language,t}=useLanguage();const say=(en:string,zh:string)=>language==='zh'?zh:en;
  const [payload,setPayload]=useState<StudyPayload|null>(null);const [loading,setLoading]=useState(true);
  const [current,setCurrent]=useState<StudyKind>('choice');const [draft,setDraft]=useState<StudyDraft>({keywords:{},choice:-1,code:''});
  const [busy,setBusy]=useState('');const [error,setError]=useState('');const [saved,setSaved]=useState(false);
  const live=useRef(true);const saving=useRef<Promise<unknown>>(Promise.resolve());
  const session=payload?.session;const lesson=session?.lesson;
  const labels={keywords:say('English keywords','英文关键词填空'),choice:say('Choose an answer','选择题'),code:say('Write code','编程题')};
  function apply(next:StudyPayload,restore=false){
    setPayload(next);setCurrent(next.session.current);
    if(restore){
      let value=next.session.draft;
      try{const raw=localStorage.getItem(`clarity.studyDraft:${next.session.id}`);if(raw){const local=JSON.parse(raw);if(local&&typeof local.code==='string'&&typeof local.choice==='number'&&local.keywords&&typeof local.keywords==='object')value=local;}}catch{/* SQLite remains available. */}
      setDraft(value);
    }
  }
  useEffect(()=>{
    live.current=true;
    request<StudyPayload|{session:null}>('study/latest',{topicId:topic.id}).then(next=>{if(live.current&&next.session)apply(next as StudyPayload,true);}).catch(e=>{if(live.current)setError(e.message);}).finally(()=>{if(live.current)setLoading(false);});
    return()=>{live.current=false;};
  },[topic.id]);
  useEffect(()=>{
    if(!session||busy)return;
    try{localStorage.setItem(`clarity.studyDraft:${session.id}`,JSON.stringify(draft));}catch{/* Server autosave remains usable. */}
    setSaved(false);
    const timer=setTimeout(()=>{
      saving.current=saving.current.catch(()=>{}).then(()=>request('study/draft',{id:session.id,...draft}));
      void saving.current.then(()=>{if(live.current)setSaved(true);}).catch(()=>{if(live.current)setSaved(false);});
    },600);return()=>clearTimeout(timer);
  },[session?.id,draft,busy]);
  async function action(name:'new'|'answer'|'reference'|'load'){
    if(busy)return;setBusy(name);setError('');
    try{
      await saving.current.catch(()=>{});
      if(name==='answer'&&current==='code'&&lesson?.coding.execution)await request('study/draft',{id:session?.id,...draft});
      const execution=name==='answer'&&current==='code'&&lesson?.coding.execution?await runCode(lesson.coding.execution,draft.code):undefined;
      const next=await request<StudyPayload>(`study/${name}`,name==='new'?{topicId:topic.id}:{id:session?.id,kind:current,...draft,execution});
      if(live.current){apply(next,name==='new'||name==='load');if(name==='new')setDraft(next.session.draft);}
    }catch(e){if(live.current)setError((e as Error).message);}
    finally{if(live.current)setBusy('');}
  }
  async function navigate(next:StudyKind){
    if(busy||!session)return;setBusy('saving');setError('');
    try{
      await saving.current.catch(()=>{});await request('study/draft',{id:session.id,...draft});
      const value=await request<StudyPayload>('study/step',{id:session.id,kind:next});
      if(live.current)apply(value);
    }catch(e){if(live.current)setError((e as Error).message);}
    finally{if(live.current)setBusy('');}
  }
  const attempts=session?.attempts.filter(a=>a.kind===current)??[];const latest=attempts.at(-1);
  const canSubmit=current==='choice'?draft.choice>=0:draft.code.trim().length>=4;
  return <section className="topic-practice mixed-practice">
    <a href={`#roadmap/${pathId}`}>← {say('Back to path','返回路线')}</a>
    <header><span className="eyebrow">{say('PRACTICE IN CONTEXT','在场景中练习')}</span><h1>{topic.title[language]}</h1><p>{topic.goal[language]}</p></header>
    {error&&<div role="alert" className="tp-error">{error}<button disabled={!!busy} onClick={()=>session?void action('load'):location.reload()}>{say('Reload saved practice','重新读取练习')}</button></div>}
    {loading?<p role="status">{say('Loading…','正在读取…')}</p>:!session?<div className="tp-card"><h2>{say('Choose, then build.','先选择，再写代码。')}</h2><p>{say('Solve a practical multiple-choice question, then implement a small feature. No terminology blanks or long explanations.','先通过选择题判断场景，再用代码完成一个小功能。无需填术语或写长篇解释。')}</p><p>{say('Two question types, saved drafts and feedback. Generation and AI reviews use Codex.','两种题型，保留草稿和反馈。出题与 AI 评审使用 Codex 额度。')}</p><button className="tp-primary" disabled={!!busy} onClick={()=>void action('new')}>{busy?say('Preparing exercises…','正在准备题目…'):say('Start practice','开始练习')}</button></div>:lesson&&<>
      <div className="tp-toolbar"><span role="status">{payload.completed.length}/2 {say('completed','已完成')}{payload.supported?` · ${say('with support','含辅助练习')}`:''}</span><button disabled={!!busy} onClick={()=>void action('new')}>{say('New variation · Codex','换一组题 · 使用额度')}</button></div>
      <details className="tp-card tp-lesson"><summary>{say('Quick explanation & example','简短讲解与示例')}</summary><p>{lesson.overview}</p><pre>{lesson.example}</pre><aside><strong>{say('Common pitfall','常见坑')}</strong><p>{lesson.pitfall}</p></aside></details>
      <nav className="tp-tabs" aria-label={say('Question types','题型')}>{studyKinds.map(k=><button key={k} aria-pressed={current===k} disabled={!!busy} onClick={()=>void navigate(k)}>{labels[k]}{payload.completed.includes(k)?' ✓':''}</button>)}</nav>
      {session.language!==language&&<p className="tp-meta">{say('This saved exercise keeps its original language. Generate a new variation for the selected language.','已保存题目保留原始语言；换一组题可使用当前语言。')}</p>}
      <div className="tp-card">
        {pathId==='react'&&!lesson.coding.execution&&current==='code'&&<p className="tp-meta">{say('This saved task uses AI review. Start a new variation for browser execution checks; your earlier work stays saved.','这道旧题使用 AI 评审。换一组题即可使用浏览器运行检查；原有作答仍会保留。')}</p>}
        {current==='choice'?<><p>{lesson.choice.scenario}</p>{lesson.choice.code&&<pre>{lesson.choice.code}</pre>}<h2>{lesson.choice.question}</h2><fieldset disabled={!!busy}><legend>{say('Choose one answer','选择一个答案')}</legend>{lesson.choice.options.map((option,i)=><label className="tp-choice" key={i}><input type="radio" name={`choice-${session.id}`} checked={draft.choice===i} onChange={()=>setDraft({...draft,choice:i})}/><span>{String.fromCharCode(65+i)}. {option}</span></label>)}</fieldset></>:<><p>{t(lesson.coding.scenario)}</p><ul>{lesson.coding.requirements.map(r=><li key={r}>{t(r)}</li>)}</ul>{lesson.coding.cases.length>0&&<details><summary>{say('Example cases','示例用例')}</summary>{lesson.coding.cases.map(c=><div key={c.id}><strong>{c.id}</strong><pre>{c.input}{'\n→ '}{c.expected}</pre></div>)}</details>}<label className="tp-reason">{lesson.coding.language}<textarea className="tp-code-editor" aria-label={say('Your code','你的代码')} spellCheck={false} maxLength={12000} disabled={!!busy} value={draft.code} onChange={e=>setDraft({...draft,code:e.target.value})}/></label><p className="tp-meta">{lesson.coding.execution?say('Runs in an isolated browser and checks actual behavior.','在隔离浏览器运行，并检查实际行为。'):say('AI code review · this language is not executed here.','AI 代码评审 · 此处暂不执行该语言。')}</p></>}
        <div className="tp-actions"><span role="status">{busy==='answer'?say('Checking…','正在检查…'):saved?say('Draft saved','草稿已保存'):say('Saving draft…','正在保存草稿…')}</span><button className="tp-primary" disabled={!!busy||!canSubmit} onClick={()=>void action('answer')}>{current==='code'?(lesson.coding.execution?say('Run checks','运行验证'):say('Review my code','评审代码')):say('Check answer','检查答案')}</button><button disabled={!!busy} onClick={()=>void action('reference')}>{say('View answer','查看答案')}</button></div>
        {latest&&!latest.error&&<div className="tp-feedback" role="status"><h3>{say('Last submission: ','上次提交：')}{latest.accepted?say('Correct','回答正确'):say('Try once more','再试一次')}</h3>{latest.blanks?.map((r,i)=><p key={r.id}>{i+1}. {r.accepted?'✓':'○'} {r.feedback}</p>)}{latest.feedback&&<p>{latest.feedback}</p>}{latest.execution&&<><small>{say('Actual browser execution','浏览器实际运行结果')}</small>{latest.execution.error&&<p>{latest.execution.error}</p>}{latest.execution.tests.map(test=><p key={test.name}>{test.passed?'✓':'○'} {t(test.name)}: {t(test.detail)}</p>)}</>}{latest.review&&<><small>{say('AI review of submitted code · no execution','上次提交代码的 AI 评审 · 未执行')}</small><blockquote>{latest.review.quote}</blockquote>{latest.review.issues.map(issue=><p key={issue}>{issue}</p>)}{latest.review.cases.map(c=><p key={c.id}>{c.passed?'✓':'○'} {c.id}: {c.reason}</p>)}</>}</div>}
        {latest?.error&&<p role="alert">{say('The check failed. Your answers are saved; retry when ready.','检查未完成，答案已保存，可以重试。')}</p>}
        {payload.references[current]&&<aside className="tp-reference"><h3>{say('Reference answer','参考答案')}</h3>{current==='code'?<pre>{payload.references[current]}</pre>:<p>{payload.references[current]}</p>}<small>{say('Recorded as supported practice. Your draft is unchanged.','已记录为辅助练习，保留你的原草稿。')}</small></aside>}
        {attempts.length>0&&<details className="tp-history"><summary>{say('Submission history','提交记录')} ({attempts.length})</summary>{attempts.map((a,i)=><article key={`${a.at}-${i}`}><strong>#{i+1} · {a.error?say('Not assessed','未评估'):a.accepted?'✓':'○'}</strong><pre>{a.input}</pre><p>{a.feedback??a.error}</p></article>)}</details>}
      </div>
      {payload.completed.length===2&&<p className="tp-completion">{say('Choice and code practice complete. This is practice evidence, not proof of long-term retention.','选择题和代码练习已完成。这是本次练习证据，不代表长期掌握。')}</p>}
    </>}
    <p className="tp-source"><a href={topic.source} target="_blank" rel="noreferrer">{say('Official reference ↗','官方资料 ↗')}</a></p>
  </section>;
}
