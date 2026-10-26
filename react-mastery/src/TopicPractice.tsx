import { useEffect, useRef, useState } from 'react';
import { request } from './api.ts';
import { useLanguage } from './language.tsx';
import type { PathTopic } from '../shared/path-types.ts';
import type { PracticeStep, TopicPayload } from '../shared/topic-practice.ts';
import './topic-practice.css';

export default function TopicPractice({topic,pathId}:{topic:PathTopic;pathId:string}) {
  const {language}=useLanguage();const say=(en:string,zh:string)=>language==='zh'?zh:en;
  const [payload,setPayload]=useState<TopicPayload|null>(null);
  const [loading,setLoading]=useState(true);const [busy,setBusy]=useState('');const [error,setError]=useState('');
  const [step,setStep]=useState<'learn'|PracticeStep>('learn');
  const [choice,setChoice]=useState(-1);const [reason,setReason]=useState('');const [saveState,setSaveState]=useState('');
  const live=useRef(true);const draftRequest=useRef<Promise<unknown>>(Promise.resolve());
  const session=payload?.session;const task=step==='learn'?null:session?.lesson.tasks[step];
  const attempts=step==='learn'?[]:session?.attempts[step]??[];const last=attempts.at(-1);
  const evaluated=attempts.filter(a=>a.review);const latestReview=evaluated.at(-1);
  function restore(next:TopicPayload,nextStep:'learn'|PracticeStep=step){
    setPayload(next);
    if(nextStep!=='learn'){
      let draft=next.session.drafts[nextStep];
      try {const local=localStorage.getItem(`clarity.topicDraft:${next.session.id}:${nextStep}`);if(local)draft=JSON.parse(local);}catch{/* SQLite remains the durable store. */}
      setChoice(draft.choice);setReason(draft.reason);
    }
  }
  useEffect(()=>{
    live.current=true;
    request<TopicPayload|{session:null}>('topic/latest',{topicId:topic.id}).then(next=>{if(live.current&&next.session){const restored=next.session.current??'learn';setStep(restored);restore(next as TopicPayload,restored);}}).catch(e=>{if(live.current)setError(e.message);}).finally(()=>{if(live.current)setLoading(false);});
    return()=>{live.current=false;};
  },[topic.id]);
  useEffect(()=>{
    if(!session||step==='learn'||busy)return;
    const draft={choice,reason};const key=`clarity.topicDraft:${session.id}:${step}`;
    try{localStorage.setItem(key,JSON.stringify(draft));}catch{/* Server autosave still works. */}
    setSaveState('saving');
    const timer=setTimeout(()=>{
      draftRequest.current=draftRequest.current.catch(()=>{}).then(()=>request('topic/draft',{id:session.id,step,...draft}));
      void draftRequest.current.then(()=>{if(live.current)setSaveState('saved');}).catch(()=>{if(live.current)setSaveState('failed');});
    },650);
    return()=>clearTimeout(timer);
  },[session?.id,step,choice,reason,busy]);
  async function action(name:'new'|'answer'|'reference'){
    if(busy)return;setBusy(name);setError('');
    try{
      await draftRequest.current.catch(()=>{});
      const next=await request<TopicPayload>(`topic/${name}`,name==='new'?{topicId:topic.id}:{id:session?.id,step,choice,reason});
      if(live.current){restore(next);if(name==='new'){setStep('learn');setChoice(-1);setReason('');}}
    }catch(e){if(live.current)setError((e as Error).message);}
    finally{if(live.current)setBusy('');}
  }
  async function switchStep(next:'learn'|PracticeStep){
    if(busy||!session)return;
    setBusy('saving');
    try{
      await draftRequest.current.catch(()=>{});
      if(step!=='learn')await request('topic/draft',{id:session.id,step,choice,reason});
      const updated=await request<TopicPayload>('topic/step',{id:session.id,step:next});
      if(live.current){setStep(next);restore(updated,next);}
    }catch{if(live.current)setError(say('Could not save. Your draft is kept in this browser.','未能同步到服务端，草稿仍保存在此浏览器。'));}
    finally{if(live.current)setBusy('');}
  }
  const status=payload?.status==='first-proof'?say('First evidence','初步理解证据'):payload?.status==='supported'?say('Completed with support','辅助练习完成'):say('In practice','练习中');
  return <section className="topic-practice">
    <a href={`#roadmap/${pathId}`}>← {say('Back to path','返回路线')}</a>
    <header><span className="eyebrow">{say('INTERACTIVE TOPIC','交互学习')}</span><h1>{topic.title[language]}</h1><p>{topic.goal[language]}</p></header>
    {error&&<div role="alert" className="tp-error">{error}<button disabled={!!busy} onClick={()=>{if(session)void request<TopicPayload>('topic/load',{id:session.id}).then(next=>restore(next)).catch(e=>setError(e.message));else location.reload();}}>{say('Reload saved progress','重新读取进度')}</button></div>}
    {loading?<p role="status">{say('Loading saved practice…','正在读取练习…')}</p>:!session?<div className="tp-card"><h2>{say('Learn it. Use it. Change the conditions.','学一个例子，用一次，再换个条件。')}</h2><p>{say('A short lesson, two concrete reasoning tasks, and feedback on your explanation. You can answer in either language.','一个短讲解、两道具体推理题，以及针对你解释的反馈。中英文均可作答。')}</p><p>{say('Generation and submission use your Codex allowance. Reading, drafts, and references do not. AI-generated exercises can contain mistakes; check the official reference if something looks wrong. Code is shown for reasoning and is not executed.','生成与提交会使用 Codex 额度；阅读、草稿和查看答案不消耗。AI 题目可能出错，存疑时对照官方资料。代码用于推理，不会执行。')}</p><button className="tp-primary" disabled={!!busy} onClick={()=>void action('new')}>{busy?say('Preparing your lesson…','正在准备课程…'):say('Start interactive practice','开始交互练习')}</button></div>:<>
      <div className="tp-toolbar"><span role="status">{status}</span><button disabled={!!busy} onClick={()=>void action('new')}>{say('New variation · uses Codex','换一道题 · 使用额度')}</button></div>
      <nav aria-label={say('Practice steps','练习步骤')} className="tp-tabs">{(['learn','try','transfer'] as const).map((s,i)=><button key={s} aria-pressed={s===step} disabled={!!busy} onClick={()=>void switchStep(s)}>{i+1}. {s==='learn'?say('Learn','看例子'):s==='try'?say('Try & explain','判断与解释'):say('Change conditions','换个条件')}</button>)}</nav>
      <p className="tp-meta">{say('AI-generated reasoning practice · code is not executed','AI 生成的推理练习 · 不执行代码')} · {session.language==='zh'?'中文':'English'} {session.language!==language&&say('(create a new variation for this language)','（换一道题可使用当前语言）')}</p>
      {step==='learn'?<div className="tp-card"><h2>{say('The idea','核心概念')}</h2><p>{session.lesson.overview}</p><pre>{session.lesson.example}</pre><p>{session.lesson.exampleExplanation}</p><aside><strong>{say('Watch out','常见坑')}</strong><p>{session.lesson.pitfall}</p></aside><button className="tp-primary" onClick={()=>void switchStep('try')}>{say('Try a question →','试一道题 →')}</button></div>:task&&<div className="tp-card"><details className="tp-context"><summary>{say('Lesson background & worked example','查看背景与完整示例')}</summary><p>{session.lesson.overview}</p><pre>{session.lesson.example}</pre><p>{session.lesson.exampleExplanation}</p></details><p>{task.scenario}</p>{task.code&&<pre>{task.code}</pre>}<h2>{task.question}</h2><fieldset disabled={!!busy}><legend>{say('Predict the outcome','先判断结果')}</legend>{task.choices.map((c,i)=><label className="tp-choice" key={i}><input type="radio" name={`choice-${session.id}-${step}`} checked={choice===i} onChange={()=>setChoice(i)}/><span>{c}</span></label>)}</fieldset><label className="tp-reason">{say('Why? Use the inputs in this question.','为什么？结合这道题的具体输入解释。')}<textarea maxLength={6000} value={reason} disabled={!!busy} onChange={e=>setReason(e.target.value)} placeholder={say('Trace what happens, then explain the rule behind it…','推导发生了什么，再解释背后的规则…')}/></label><div className="tp-actions"><span role="status">{busy==='answer'?say('Codex is reviewing your reasoning…','Codex 正在检查推理…'):saveState==='saved'?say('Draft saved','草稿已保存'):saveState==='failed'?say('Server save failed · draft kept in browser','服务端同步失败 · 浏览器保留草稿'):say('Saving draft…','正在保存草稿…')}</span><button className="tp-primary" disabled={!!busy||choice<0||reason.trim().length<8||evaluated.length>=4} onClick={()=>void action('answer')}>{say('Check my reasoning','检查我的理解')}</button><button disabled={!!busy} onClick={()=>void action('reference')}>{say('View reference answer','查看参考答案')}</button></div>
      {latestReview?.review&&<div className="tp-feedback"><h3>{say('Feedback on the last submitted answer','上次提交的反馈')}</h3><p>{latestReview.review.feedback}</p><blockquote>{latestReview.review.quote}</blockquote>{latestReview.review.misconception&&<p>{latestReview.review.misconception}</p>}<p><strong>{say('One step further: ','再想一步：')}</strong>{latestReview.review.followUp}</p><small>{say('AI review, not a code execution result.','这是 AI 推理评估，不是代码执行结果。')}</small></div>}
      {last?.error&&<p role="alert">{say('The last assessment failed; your answer is saved. You can submit again.','上次评估未完成，答案已保存，可以重试。')}</p>}
      {payload.references[step]&&<aside className="tp-reference"><h3>{say('Reference answer','参考答案')}</h3><p>{payload.references[step]}</p><small>{say('This attempt is recorded as supported practice.','本轮已记录为辅助练习。')}</small></aside>}
      {evaluated.length>=4&&<p>{say('Read the reference, then start a new variation when ready.','先看参考答案，准备好后可以换一道题再试。')}</p>}
      {step==='try'&&<button disabled={!!busy} onClick={()=>void switchStep('transfer')}>{say('Change one condition →','换个条件试试 →')}</button>}
      {evaluated.length>0&&<details className="tp-history"><summary>{say('Earlier answers & feedback','历史回答与反馈')} ({evaluated.length})</summary>{evaluated.map((a,i)=><article key={a.at}><strong>#{i+1}</strong><p>{a.reason}</p><p>{a.review?.feedback}</p></article>)}</details>}
      </div>}
      {payload.status!=='practicing'&&<p className="tp-completion">{say('Both tasks have evidence. This is a first practice result, not proof of long-term retention or working implementation.','两道题已获得理解证据。这是本次练习结果，不代表长期记忆或已完成真实项目。')}</p>}
    </>}
    <p className="tp-source"><a href={topic.source} target="_blank" rel="noreferrer">{say('Official reference ↗','对照官方资料 ↗')}</a></p>
  </section>;
}
