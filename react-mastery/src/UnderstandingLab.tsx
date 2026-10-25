import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, Lightbulb, LoaderCircle, Mic, Square, Volume2 } from 'lucide-react';
import { useLanguage } from './language.tsx';
import { request } from './api.ts';
import { recognitionConstructor, recognitionText } from './voice-input.ts';
import type { RecognitionService } from './voice-input.ts';
import type { UnderstandingPayload, Bilingual } from '../shared/understanding.ts';
import './understanding.css';

export default function UnderstandingLab() {
  const {language}=useLanguage();
  const say=(en:string,zh:string)=>language==='zh'?zh:en;
  const text=(value:Bilingual)=>value[language];
  const [payload,setPayload]=useState<UnderstandingPayload|null>(null);
  const [outcomes,setOutcomes]=useState<string[]>([]);
  const [choice,setChoice]=useState('');
  const [answer,setAnswer]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [saved,setSaved]=useState(false);
  const [consent,setConsent]=useState(false);
  const [listening,setListening]=useState(false);
  const [interim,setInterim]=useState('');
  const speech=useRef<RecognitionService|null>(null);
  const identity=useRef('');
  const task=payload?.task; const session=payload?.session;
  const questionKey=session && task ? `${session.id}:${task.id}` : '';
  const currentAttempts=task ? session?.attempts[task.id]??[] : [];
  const evaluated=currentAttempts.filter(a=>a.review);
  const latest=evaluated.at(-1);
  const canAnswer=!!task && evaluated.length<2 && !latest?.verified;
  function apply(next:UnderstandingPayload,restore=false) {
    setPayload(next);
    if(next.session) try {localStorage.setItem('clarity.understandingSession',next.session.id);} catch {/* Records still persist in SQLite. */}
    const key=next.session && next.task ? `${next.session.id}:${next.task.id}` : '';
    if(restore || identity.current!==key) {
      identity.current=key;
      const draft=next.task ? next.session?.drafts[next.task.id] : undefined;
      setOutcomes(draft?.outcomes ?? (next.task?.outcomeLabels.map(()=>'')) ?? []);
      setChoice(draft?.choice??''); setAnswer(draft?.explanation??''); setSaved(false);
    }
  }
  useEffect(()=>{
    let live=true;
    let stored:string|null=null;try{stored=localStorage.getItem('clarity.understandingSession');}catch{/* Use the latest server record. */}
    const load=stored ? request<UnderstandingPayload>('understanding/load',{id:stored}).catch(()=>request<UnderstandingPayload>('understanding')) : request<UnderstandingPayload>('understanding');
    load.then(next=>{if(live)apply(next,true);}).catch(e=>{if(live)setError(e.message);});
    return()=>{live=false;};
  },[]);
  useEffect(()=>{
    if(!session || !task || busy) return;
    setSaved(false);
    const expectedKey=questionKey;
    const timer=setTimeout(()=>{
      void request<UnderstandingPayload>('understanding/draft',{id:session.id,probe:task.id,outcomes,choice,explanation:answer}).then(()=>{if(identity.current===expectedKey)setSaved(true);}).catch(()=>{if(identity.current===expectedKey)setSaved(false);});
    },700);
    return()=>clearTimeout(timer);
  },[questionKey,outcomes,choice,answer,busy]);
  useEffect(()=>{
    speech.current?.abort(); speech.current=null; setListening(false); setInterim('');
    window.speechSynthesis?.cancel();
    return()=>{const instance=speech.current;speech.current=null;instance?.abort();window.speechSynthesis?.cancel();};
  },[questionKey,language]);
  async function action(action:string,extra:Record<string,unknown>={}) {
    if(busy || listening) return;
    setBusy(true);setError('');
    try {
      if(session && task) await request('understanding/draft',{id:session.id,probe:task.id,outcomes,choice,explanation:answer});
      const next=await request<UnderstandingPayload>(`understanding/${action}`,{id:session?.id,probe:task?.id,...extra});
      apply(next,action==='new'||action==='load');
      if(action==='answer' && next.task) {
        // Keep the earlier explanation as evidence; ask only for a clarification.
        const last=next.session?.attempts[next.task.id]?.at(-1);
        if(last?.review && !last.verified) setAnswer('');
      }
    } catch(e) {
      setError((e as Error).message);
      // A failed assessment still has a durable submission; restore it explicitly
      // without dropping a learner's visible text or pretending an AI result exists.
      if(session) void request<UnderstandingPayload>('understanding/load',{id:session.id}).then(next=>apply(next)).catch(()=>{});
    } finally {setBusy(false);}
  }
  function startVoice() {
    const Constructor=recognitionConstructor();
    if(!Constructor || !consent || busy || listening || !canAnswer) return;
    window.speechSynthesis?.cancel();
    const previous=speech.current;speech.current=null;previous?.abort();
    const instance=new Constructor(); const base=answer.trim();
    instance.lang=language==='zh'?'zh-CN':'en-US';instance.continuous=true;instance.interimResults=true;
    instance.onresult=event=>{
      if(speech.current!==instance)return;
      const result=recognitionText(event.results);
      setAnswer([base,result.final].filter(Boolean).join('\n'));setInterim(result.interim);
    };
    instance.onerror=event=>{
      if(speech.current!==instance)return;
      setError(event.error==='not-allowed' ? say('Microphone permission was denied. You can type instead.','麦克风权限未获允许，可以继续打字。') : say(`Speech recognition stopped (${event.error}). Your text is preserved.`,`语音识别已停止（${event.error}），已转写的文字仍保留。`));
      speech.current=null;instance.abort();setListening(false);setInterim('');
    };
    instance.onend=()=>{if(speech.current===instance){speech.current=null;setListening(false);setInterim('');}};
    speech.current=instance;setListening(true);setError('');
    try{instance.start();}catch{speech.current=null;setListening(false);setError(say('Speech could not start. Try a supported browser or type your answer.','无法开始识别，请使用支持的浏览器或直接打字。'));}
  }
  const verified=payload?.evidence.filter(e=>e.verified).length??0;
  const independent=payload?.evidence.filter(e=>e.independent).length??0;
  const supported=typeof window!=='undefined' && !!recognitionConstructor();
  if(!payload) return <div className="understanding-loading"><LoaderCircle className="spin"/>{error||say('Opening the lab…','正在打开实验室……')}</div>;
  return <section className="understanding-lab">
    <div className="page-heading"><div><span className="eyebrow">{say('UNDERSTANDING LAB · FIRST EXPERIMENT','理解验证实验室 · 首个实验')}</span><h1>{say('Can your explanation survive a change?','换个条件，你还能解释吗？')}</h1><p>{say('State snapshots & queues. Three short probes, one at a time.','状态快照与更新队列。三个短问题，每次只问一个。')}</p></div></div>
    {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={()=>setError('')}>{say('Dismiss','关闭')}</button></div>}
    {!session && <div className="understanding-welcome"><h2>{say('Start with what you already know.','从你已经会的开始。')}</h2><p>{say('Predict a result, change the order, then repair the code. Correct words alone do not count; correct numbers alone do not count either.','预测结果、改变顺序、修复代码。会背术语不算，碰巧答对数字也不算。')}</p><button className="primary" disabled={busy} onClick={()=>void action('new')}>{say('Try the experiment','开始实验')}<ArrowRight size={16}/></button></div>}
    {session && <>
      <div className="understanding-track" aria-label={say('Evidence collected','证据收集进度')}>{payload.evidence.map((e,i)=><div key={e.id} className={task?.id===e.id?'current':''}>{e.verified?<CheckCircle2 size={18}/>:<Circle size={18}/>}<span>{i+1}. {say(['Predict','Change','Repair'][i],['预测','换条件','修复'][i])}</span><small>{e.verified?(e.independent?say('Independent evidence','独立证据'):say('With support','辅助后完成')):e.attempts?say('Gap recorded','已记录缺口'):say('Not checked yet','待验证')}</small></div>)}</div>
      {task ? <div className="understanding-workspace"><article className="probe-card">
        <div className="probe-heading"><span className="pill">{say(`PROBE ${session.current+1} / 3`,`问题 ${session.current+1} / 3`)}</span><span className="save-label">{saved?say('Draft saved','草稿已保存'):say('Autosave','自动保存')}</span></div>
        <h2>{text(task.title)}</h2><p className="probe-question">{text(task.question)}</p>
        {'speechSynthesis' in window && <button className="text-button" disabled={listening} onClick={()=>{window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text(task.question));utterance.lang=language==='zh'?'zh-CN':'en-US';window.speechSynthesis.speak(utterance);}}><Volume2 size={16}/>{say('Read question','朗读问题')}</button>}
        <div className={task.alternateCode?'probe-code-pair':''}><pre className="example-code"><code>{task.code}</code></pre>{task.alternateCode&&<pre className="example-code"><code>{task.alternateCode}</code></pre>}</div>
        {task.choices && <fieldset className="repair-choices"><legend>{say('Choose a repair','选择修复')}</legend>{task.choices.map((option,i)=><label key={option.id}><input type="radio" name="repair-choice" value={option.id} checked={choice===option.id} disabled={busy||listening||!canAnswer} onChange={()=>setChoice(option.id)}/><span>{String.fromCharCode(65+i)}</span><code>{option.code}</code></label>)}</fieldset>}
        <div className="prediction-inputs">{task.outcomeLabels.map((label,i)=><label key={i}>{text(label)}<input type="number" aria-label={text(label)} value={outcomes[i]??''} disabled={busy||listening||!canAnswer} onChange={event=>setOutcomes(old=>old.map((value,index)=>index===i?event.target.value:value))}/></label>)}</div>
        {latest && <div className={`probe-feedback ${latest.verified?'verified':''}`} aria-live="polite"><strong>{latest.verified?say('Result and reasoning checked','结果和推理均已验证'):say('One gap to work on','补上一个缺口')}</strong><p>{latest.review?.feedback}</p>{latest.outcomeCorrect===false&&<p>{say('The prediction or repair does not match the code. Revise it as well as your explanation.','预测或修复选择与代码不符，请同时修正结果和解释。')}</p>}<blockquote>“{latest.review?.quote}”</blockquote>{!latest.verified&&<p><strong>{say('Follow-up: ','只补答这一点：')}</strong>{latest.review?.followUp}</p>}</div>}
        {canAnswer && <>
          <label className="spoken-answer-label" htmlFor="understanding-answer">{latest?say('Clarify just the missing part','只补充缺失的部分'):say('Talk through your reasoning','说说你的推理过程')}</label>
          {latest && <details className="previous-explanation"><summary>{say('Your previous explanation is kept','之前的讲解已保留')}</summary><p>{evaluated[0].explanation}</p></details>}
          <textarea id="understanding-answer" className="explain-input" value={answer} onChange={event=>setAnswer(event.target.value)} disabled={busy||listening} placeholder={say('Trace the values. Why does this happen?','按顺序推导数值，说说为什么。')}/>
          {interim&&<p className="voice-interim" aria-live="polite">{interim}</p>}
          <div className="voice-tools">{supported?<><label><input type="checkbox" checked={consent} disabled={listening||busy} onChange={event=>setConsent(event.target.checked)}/>{say('Allow browser speech recognition','允许浏览器语音识别')}</label><button className="secondary" disabled={busy||(!listening&&!consent)} onClick={()=>listening?speech.current?.stop():startVoice()}>{listening?<Square size={16}/>:<Mic size={16}/>} {listening?say('Finish speaking','说完了'):say('Speak your answer','语音回答')}</button><small>{say('Your browser may send audio to its speech service. Edit the transcript before submitting. Only submitted text goes to Codex.','浏览器可能使用其语音服务处理音频。转写后可修改，只有提交的文字会发给 Codex。')}</small></>:<p>{say('Voice recognition is unavailable in this browser. Type here, or open this local app in a browser with speech recognition.','当前浏览器不支持语音识别。可直接打字，或在支持语音识别的浏览器中打开此本机应用。')}</p>}</div>
          <button className="primary" disabled={busy||listening||answer.trim().length<8||outcomes.some(value=>!value.trim()||!Number.isFinite(Number(value)))||outcomes.length!==task.outcomeLabels.length||!!task.choices&&!choice} onClick={()=>void action('answer',{outcomes:outcomes.map(Number),choice,explanation:answer})}>{busy?<LoaderCircle className="spin" size={16}/>:<ArrowRight size={16}/>} {busy?say('Checking reasoning…','正在验证推理……'):latest?say('Submit clarification','提交补充'):say('Check my reasoning','验证我的推理')}</button>
        </>}
        {latest&&<button className="secondary probe-next" disabled={busy||listening} onClick={()=>void action('advance')}>{latest.verified?say('Next challenge','下一个挑战'):say('Continue; keep this gap','继续，保留这个缺口')}<ArrowRight size={16}/></button>}
      </article><aside className="probe-aside"><h3>{say('What counts as understanding?','怎样才算理解？')}</h3><p>{say('Correct result + a causal explanation that still works when the example changes.','结果正确，并能用因果关系解释变化后的例子。')}</p><p>{say('This prototype checks one narrow skill. Speaking fluently is not proof of durable understanding.','本版只验证一个具体能力。说得流畅不代表长期理解。')}</p><button className="text-button" disabled={busy||listening} onClick={()=>void action('help')}><Lightbulb size={16}/>{say('Explain the missing idea','讲解这个知识点')}</button>{payload.help&&<div className="probe-help"><strong>{say('Learning support · recorded','学习帮助 · 已记录')}</strong><p>{text(payload.help)}</p><small>{say('This probe now counts as supported practice.','本题计为辅助练习。')}</small></div>}<a href="https://react.dev/learn/queueing-a-series-of-state-updates" target="_blank" rel="noreferrer" className="text-button">{say('Official React reference','React 官方资料')}</a></aside></div> : <div className="understanding-summary"><span className="eyebrow">{say('EVIDENCE, NOT A MASTERY CERTIFICATE','理解证据，不是掌握证书')}</span><h2>{say(`${verified}/3 probes understood in this session`,`本轮 ${verified}/3 项已验证理解`)}</h2><p>{say(`${independent} were independent. Supported retries remain visible.`,`${independent} 项为独立完成；辅助和补答记录仍然保留。`)}</p><p>{session.reviewOf&&independent===3?say('A delayed check added retention evidence for this skill.','本次延迟复测增加了这个能力的保留证据。'):say('Long-term retention has not been established by this session.','本轮还不能证明长期保留。')}</p>{session.reviewAt&&<p>{say('Delayed check opens: ','延迟复测开放时间：')}{new Date(session.reviewAt).toLocaleString(language==='zh'?'zh-CN':'en-NZ')}</p>}<button className="primary" disabled={busy} onClick={()=>void action('new')}>{say('Try a fresh variation','换个例子再试')}<ArrowRight size={16}/></button></div>}
    </>}
    {session?.completedAt && <details className="understanding-history"><summary>{say('Evidence trail: answers and feedback','证据记录：作答与反馈')}</summary>{payload.trail.map(entry=><section className="probe-trail" key={entry.task.id}><h3>{text(entry.task.title)}</h3><p>{text(entry.task.question)}</p><pre className="example-code"><code>{entry.task.code}</code></pre>{entry.task.alternateCode&&<pre className="example-code"><code>{entry.task.alternateCode}</code></pre>}{entry.helped&&<p>{say('Learning help was viewed.','本题查看过学习帮助。')}</p>}{entry.attempts.map((attempt,index)=><div key={index}><strong>{say(`Attempt ${index+1}`,`第 ${index+1} 次作答`)} · {attempt.outcomes.join(', ')}{attempt.choice ? ` · ${attempt.choice}` : ''}</strong><p className="original-answer">{attempt.explanation}</p>{attempt.review?<><p>{attempt.review.feedback}</p><blockquote>“{attempt.review.quote}”</blockquote></>:<p>{attempt.error??say('No completed assessment','评估未完成')}</p>}</div>)}</section>)}</details>}
    {!!payload.history.length&&<details className="understanding-history"><summary>{say('Recent experiments & delayed checks','最近实验与延迟复测')}</summary>{payload.history.map(item=><div key={item.id}><span>{new Date(item.completedAt??item.createdAt).toLocaleDateString(language==='zh'?'zh-CN':'en-NZ')} · {item.independent}/3 {say('independent','独立完成')}</span><button className="text-button" disabled={busy||listening} onClick={()=>void action('load',{id:item.id})}>{say('Open','查看')}</button>{item.reviewAt&&Date.parse(item.reviewAt)<=Date.now()&&<button className="secondary" disabled={busy||listening} onClick={()=>void action('new',{reviewOf:item.id})}>{say('Take delayed check','开始延迟复测')}</button>}</div>)}</details>}
  </section>;
}
