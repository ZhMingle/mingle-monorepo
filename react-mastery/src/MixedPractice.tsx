import CodeBlock from './CodeBlock.tsx';
import TopicDirectory from './TopicDirectory.tsx';
import type {TopicProgress} from '../shared/learning-progress.ts';
import { displayCode,isSourceExample } from '../shared/rich-text.ts';
import LearningText, { Inline } from './LearningText.tsx';
import OptionContent from './OptionContent.tsx';
import { usePresentation } from './usePresentation.ts';
import ExerciseTutor from './ExerciseTutor.tsx';
import CodeEditor from './CodeEditor.tsx';
import { runCode } from './sandbox.ts';
import { useEffect, useRef, useState } from 'react';
import { request } from './api.ts';
import { useLanguage } from './language.tsx';
import type { PathTopic } from '../shared/path-types.ts';
import { canContinueStudy,studyKinds } from '../shared/study.ts';
import type { StudyDraft,StudyKind,StudyPayload } from '../shared/study.ts';
import './topic-practice.css';
import { findLearningPath } from '../shared/paths.ts';
import { topicNeighbors } from '../shared/learning-progress.ts';

export default function MixedPractice({topic,pathId,reloadProgress,progress}:{topic:PathTopic;pathId:string;reloadProgress:()=>void;progress:Record<string,TopicProgress>}){
  const {language,t}=useLanguage();const say=(en:string,zh:string)=>language==='zh'?zh:en;
  const [rawPayload,setPayload]=useState<StudyPayload|null>(null);const [loading,setLoading]=useState(true);
  const [current,setCurrent]=useState<StudyKind>('choice');const [draft,setDraft]=useState<StudyDraft>({keywords:{},choice:-1,code:''});
  const [busy,setBusy]=useState('');const [error,setError]=useState('');const [savedCode,setSavedCode]=useState<{id:string;code:string}|null>(null);
  const live=useRef(true);const saving=useRef<Promise<unknown>>(Promise.resolve());
  const questionCard=useRef<HTMLDivElement|null>(null);
  const {view:payload,translating,translationError,retryTranslation}=usePresentation(rawPayload,language);
  const session=payload?.session;const lesson=session?.lesson;
  const codeChanged=!!lesson&&displayCode(draft.code).code!==displayCode(lesson.coding.starter).code;
  const saved=savedCode?.id===session?.id&&savedCode?.code===draft.code;
  const canContinue=canContinueStudy(session);
  const path=findLearningPath(pathId)!;const journey=topicNeighbors(path,topic.id);
  const labels={keywords:say('English keywords','英文关键词填空'),choice:say('Choose an answer','选择题'),code:say('Write code','编程题')};
  function apply(next:StudyPayload,restore=false){
    setPayload(next);setCurrent(next.session.current);
    if(restore){
      let value=next.session.draft;
      try{const raw=localStorage.getItem(`clarity.studyDraft:${next.session.id}`);if(raw){const local=JSON.parse(raw);if(local&&typeof local.code==='string'&&typeof local.choice==='number'&&local.keywords&&typeof local.keywords==='object')value=local;}}catch{/* SQLite remains available. */}
      setDraft({...value,code:displayCode(value.code).code});
    }
  }
  useEffect(()=>{
    live.current=true;
    request<StudyPayload|{session:null}>('study/open',{topicId:topic.id}).then(async next=>{
      if(!live.current||!next.session)return;
      const requested=location.hash.split('/')[3];
      if((requested==='choice'||requested==='code')&&next.session.current!==requested){
        next=await request<StudyPayload>('study/step',{id:next.session.id,kind:requested});
      }
      if(live.current)apply(next as StudyPayload,true);
    }).catch(e=>{if(live.current)setError(e.message);}).finally(()=>{if(live.current)setLoading(false);});
    return()=>{live.current=false;};
  },[topic.id]);
  useEffect(()=>{
    if(!session||busy)return;
    try{localStorage.setItem(`clarity.studyDraft:${session.id}`,JSON.stringify(draft));}catch{/* Server autosave remains usable. */}
    setSavedCode(null);
    const timer=setTimeout(()=>{
      saving.current=saving.current.catch(()=>{}).then(()=>request('study/draft',{id:session.id,...draft}));
      void saving.current.then(()=>{if(live.current)setSavedCode({id:session.id,code:draft.code});}).catch(()=>{if(live.current)setSavedCode(null);});
    },600);return()=>clearTimeout(timer);
  },[session?.id,draft,busy]);
  useEffect(()=>{
    if(!rawPayload?.session.id||!journey.next)return;
    // Cache only the adjacent topic, without marking it started.
    void request('study/prefetch',{topicId:topic.id}).catch(()=>{});
  },[rawPayload?.session.id,topic.id]);
  async function action(name:'new'|'answer'|'reference'|'load'){
    if(busy)return;setBusy(name);setError('');
    try{
      await saving.current.catch(()=>{});
      if(name==='answer'&&current==='code'&&lesson?.coding.execution)await request('study/draft',{id:session?.id,...draft});
      const execution=name==='answer'&&current==='code'&&lesson?.coding.execution?await runCode(rawPayload!.session.lesson.coding.execution!,draft.code):undefined;
      const next=await request<StudyPayload>(`study/${name}`,name==='new'?{topicId:topic.id}:{id:session?.id,kind:current,...draft,execution});
      if(live.current){apply(next,name==='new'||name==='load');if(name==='answer')reloadProgress();}
    }catch(e){if(live.current)setError((e as Error).message);}
    finally{if(live.current)setBusy('');}
  }
  async function navigate(next:StudyKind){
    if(busy||!session)return;setBusy('saving');setError('');
    try{
      await saving.current.catch(()=>{});await request('study/draft',{id:session.id,...draft});
      const value=await request<StudyPayload>('study/step',{id:session.id,kind:next});
      if(live.current){apply(value);requestAnimationFrame(()=>questionCard.current?.scrollIntoView({behavior:'smooth',block:'start'}));}
    }catch(e){if(live.current)setError((e as Error).message);}
    finally{if(live.current)setBusy('');}
  }
  async function openTopic(id?:string){
    if(busy)return;setBusy('saving');setError('');
    try{
      await saving.current.catch(()=>{});
      if(session)await request('study/draft',{id:session.id,...draft});
      location.hash=id?`roadmap/${pathId}/${id}`:`roadmap/${pathId}`;
      window.scrollTo({top:0,behavior:'instant'});
    }catch(e){if(live.current)setError((e as Error).message);}
    finally{if(live.current)setBusy('');}
  }
  async function continueTopic(){
    if(!canContinue)return;
    await openTopic(journey.next?.id);
  }
  const attempts=session?.attempts.filter(a=>a.kind===current)??[];const latest=attempts.at(-1);
  const canSubmit=current==='choice'?draft.choice>=0:draft.code.trim().length>=4;
  return <div className="practice-workspace"><TopicDirectory docked path={path} current={topic.id} progress={progress} disabled={!!busy} onNavigate={id=>void openTopic(id)}/><section className="topic-practice mixed-practice">
    <nav className="topic-journey" aria-label={say('Topic navigation','知识点导航')}>
      <a href={`#roadmap/${pathId}`}>← {say('Back to path','返回路线')}</a>
      <h1 title={topic.title[language]}>{topic.title[language]}</h1>
      <button disabled={!!busy||!journey.previous} onClick={()=>void openTopic(journey.previous!.id)}>← {say('Previous topic','上一知识点')}</button>
      <span>{journey.index+1}/{journey.topics.length}</span><TopicDirectory path={path} current={topic.id} progress={progress} disabled={!!busy} onNavigate={id=>void openTopic(id)}/>
      {canContinue&&journey.next&&<button disabled={!!busy} onClick={()=>void continueTopic()}>{say('Next topic','下一知识点')} →</button>}
    </nav>
    {error&&<div role="alert" className="tp-error">{error}<button disabled={!!busy} onClick={()=>session?void action('load'):location.reload()}>{say('Reload saved practice','重新读取练习')}</button></div>}
    {translating&&<p role="status">{say('Translating this exercise…','正在切换题目语言…')}</p>}
    {translationError&&<div role="alert" className="tp-error">{say('Translation failed: ','翻译未完成：')}{translationError}<button onClick={retryTranslation}>{say('Retry translation','重试翻译')}</button></div>}
    {loading?<p role="status">{say('Preparing exercises…','正在准备题目…')}</p>:!session?<div className="tp-card"><h2>{say('Choose, then build.','先选择，再写代码。')}</h2><button className="tp-primary" disabled={!!busy} onClick={()=>void action('new')}>{busy?say('Preparing exercises…','正在准备题目…'):say('Start practice','开始练习')}</button></div>:lesson&&<>

      <details className="tp-card tp-lesson"><summary>{say('Quick explanation & example','简短讲解与示例')}</summary><LearningText text={lesson.overview} pathId={pathId}/>{isSourceExample(lesson.example)?<CodeBlock code={lesson.example} language={lesson.coding.language} pathId={pathId} label={say('Worked example','讲解示例')}/>:<LearningText text={lesson.example} language={lesson.coding.language} pathId={pathId}/>}<aside><strong>{say('Common pitfall','常见坑')}</strong><LearningText text={lesson.pitfall} pathId={pathId}/></aside></details>
      <div className="tp-practice-controls"><nav className="tp-tabs" aria-label={say('Question types','题型')}>{studyKinds.map(k=><button key={k} aria-pressed={current===k} disabled={!!busy} onClick={()=>void navigate(k)}>{labels[k]}{payload.completed.includes(k)&&<span className="tp-tab-complete">{say('Done','已完成')}</span>}</button>)}</nav><div className="tp-toolbar"><span role="status">{payload.completed.length}/2 {say('completed','已完成')}{payload.supported?` · ${say('with support','含辅助练习')}`:''}</span><button disabled={!!busy} onClick={()=>void action('new')}>{say('New variation · Codex','换一组题 · 使用额度')}</button></div></div>


      <div className="tp-card" ref={questionCard}>
        {['react.props','react.snapshot','react.immutable','react.keys','react.derived','react.reducer'].includes(topic.id)&&!lesson.coding.execution&&current==='code'&&<p className="tp-meta">{say('This saved task uses AI review. Start a new variation for browser execution checks; your earlier work stays saved.','这道旧题使用 AI 评审。换一组题即可使用浏览器运行检查；原有作答仍会保留。')}</p>}
        {current==='choice'?<><LearningText text={lesson.choice.scenario} pathId={pathId}/>{lesson.choice.code&&<CodeBlock code={lesson.choice.code} language={lesson.coding.language} pathId={pathId} label={say('Question code','题目代码')}/>}<h2 className="learning-text"><Inline text={lesson.choice.question}/></h2><fieldset disabled={!!busy}><legend>{say('Choose one answer','选择一个答案')}</legend>{lesson.choice.options.map((option,i)=><label className="tp-choice" key={i}><input type="radio" name={`choice-${session.id}`} checked={draft.choice===i} onChange={()=>setDraft({...draft,choice:i})}/><div className="tp-option-body"><span>{String.fromCharCode(65+i)}.</span><OptionContent text={option} pathId={pathId}/></div></label>)}</fieldset></>:<><LearningText text={t(lesson.coding.scenario)} language={lesson.coding.language} pathId={pathId}/><ul className="learning-text">{lesson.coding.requirements.map(r=><li key={r}><Inline text={t(r)}/></li>)}</ul>{lesson.coding.cases.length>0&&<details><summary>{say('Example cases','示例用例')}</summary>{lesson.coding.cases.map(c=><div key={c.id}><strong>{c.id}</strong><pre>{c.input}{'\n→ '}{c.expected}</pre></div>)}</details>}<CodeEditor key={session.id} language={lesson.coding.language} pathId={pathId} value={draft.code} starter={displayCode(lesson.coding.starter).code} label={say('Your code','你的代码')} disabled={!!busy} maxLength={12000} onChange={code=>setDraft(previous=>({...previous,code}))}/><p className="tp-meta">{lesson.coding.execution?say('Runs in an isolated browser and checks actual behavior.','在隔离浏览器运行，并检查实际行为。'):say('AI code review · this language is not executed here.','AI 代码评审 · 此处暂不执行该语言。')}</p></>}
        <div className="tp-actions">{(current==='code'&&codeChanged||busy==='answer')&&<span role="status">{busy==='answer'?say('Checking…','正在检查…'):saved?say('Draft saved','草稿已保存'):say('Saving draft…','正在保存草稿…')}</span>}<button className="tp-primary" disabled={!!busy||!canSubmit} onClick={()=>void action('answer')}>{current==='code'?(lesson.coding.execution?say('Run checks','运行验证'):say('Review my code','评审代码')):say('Check answer','检查答案')}</button><button disabled={!!busy} onClick={()=>void action('reference')}>{say('View answer','查看答案')}</button></div>
        {latest&&!latest.error&&<div className="tp-feedback" role="status"><h3>{say('Last submission: ','上次提交：')}{latest.accepted?say('Correct','回答正确'):say('Try once more','再试一次')}</h3>{latest.blanks?.map((r,i)=><p key={r.id}>{i+1}. {r.accepted?'✓':'○'} {r.feedback}</p>)}{latest.feedback&&!(current==='choice'&&payload.references[current])&&<LearningText text={latest.feedback} language={lesson.coding.language} pathId={pathId}/>}{latest.execution&&<><small>{say('Actual browser execution','浏览器实际运行结果')}</small>{latest.execution.error&&<p>{latest.execution.error}</p>}{latest.execution.tests.map(test=><p key={test.name}>{test.passed?'✓':'○'} {t(test.name)}: {t(test.detail)}</p>)}</>}{latest.review&&<><small>{say('AI review of submitted code · no execution','上次提交代码的 AI 评审 · 未执行')}</small><blockquote>{latest.review.quote}</blockquote>{latest.review.issues.map(issue=><p key={issue}>{issue}</p>)}{latest.review.cases.map(c=><p key={c.id}>{c.passed?'✓':'○'} {c.id}: {c.reason}</p>)}</>}</div>}
        {latest?.error&&<p role="alert">{say('The check failed. Your answers are saved; retry when ready.','检查未完成，答案已保存，可以重试。')}</p>}
        {payload.references[current]&&<aside className="tp-reference"><h3>{say('Reference answer','参考答案')}</h3>{current==='code'?<CodeBlock code={payload.references[current]!} language={lesson.coding.language} pathId={pathId} label={say('Reference code','参考代码')}/>:<LearningText text={payload.references[current]!} language={lesson.coding.language} pathId={pathId}/>}<small>{say('Recorded as supported practice. Your draft is unchanged.','已记录为辅助练习，保留你的原草稿。')}</small></aside>}
      </div>
    </>}
    <nav className="topic-continuation" aria-label={say('Continue learning','继续学习')}>
      {session&&current==='choice'?<button className="tp-primary" disabled={!!busy} onClick={()=>void navigate('code')}>{say('Continue to code →','继续编程题 →')}</button>:<span/>}
      {canContinue?(journey.next?<button disabled={!!busy} onClick={()=>void continueTopic()}>{say('Next: ','下一部分：')}{journey.next.title[language]} →</button>:<button disabled={!!busy} onClick={()=>void continueTopic()}>{say('End of path · view progress','已到路线末尾 · 查看进度')} →</button>):session&&<p role="status">{payload.completed.includes('choice')?say('Pass the code task to unlock the next topic.','通过编程题后解锁下一部分。'):payload.completed.includes('code')?say('Pass the choice question to unlock the next topic.','通过选择题后解锁下一部分。'):say('Pass both tasks to unlock the next topic.','两项任务都通过后解锁下一部分。')}</p>}
    </nav>
    <p className="tp-source"><a href={topic.source} target="_blank" rel="noreferrer">{say('Official reference ↗','官方资料 ↗')}</a></p>
  </section>
    {session&&<ExerciseTutor key={session.id} id={session.id} mode="study" step={current} onHelp={()=>{void request<StudyPayload>('study/load',{id:session.id}).then(setPayload).catch(e=>setError(e.message));reloadProgress();}}/>}
  </div>;
}
