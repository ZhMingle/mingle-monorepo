import { useEffect,useRef,useState } from 'react';
import { request } from './api.ts';
import { useLanguage } from './language.tsx';
import { usePresentation } from './usePresentation.ts';
import './exercise-tutor.css';
type Message={role:'user'|'assistant';content:string;language?:'en'|'zh'};
export default function ExerciseTutor({id,mode,step,onHelp}:{id:string;mode:'study'|'topic';step:string;onHelp:()=>void}){
  const {language}=useLanguage();const say=(en:string,zh:string)=>language==='zh'?zh:en;
  const [messages,setMessages]=useState<Message[]>(()=>{
    try{const value=JSON.parse(localStorage.getItem(`clarity.tutor:${mode}:${id}`)??'[]');return Array.isArray(value)?value.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').slice(-40):[];}catch{return [];}
  });
  const [question,setQuestion]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const transcript=useRef<HTMLDivElement>(null);const live=useRef(true);const sending=useRef(false);
  const {view,translating,translationError,retryTranslation}=usePresentation(messages.length?{replies:messages.map(m=>({feedback:m.role==='assistant'&&m.language!==language?m.content:''}))}:null,language);
  useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
  useEffect(()=>{try{localStorage.setItem(`clarity.tutor:${mode}:${id}`,JSON.stringify(messages));}catch{/* Current conversation remains visible. */}if(transcript.current)transcript.current.scrollTop=transcript.current.scrollHeight;},[messages,busy]);
  async function send(){
    if(sending.current||!question.trim())return;
    sending.current=true;setBusy(true);setError('');const content=question.trim();const history=messages.slice(-10).map(m=>({role:m.role,content:m.content.slice(0,6000)}));
    try{
      const result=await request<{reply:string}>('tutor',{id,mode,step,message:content,history});
      if(live.current){setMessages(previous=>[...previous,{role:'user',content,language},{role:'assistant',content:result.reply,language}].slice(-40) as Message[]);setQuestion('');onHelp();}
    }catch(e){if(live.current)setError((e as Error).message);}
    finally{sending.current=false;if(live.current)setBusy(false);}
  }
  return <aside className="exercise-tutor" aria-labelledby={`tutor-title-${id}`}>
      <header><h2 id={`tutor-title-${id}`}>{say('Ask about this exercise','追问这道题')}</h2><p>{say('Ask while reading. Get explanations for the current exercise.','边看题边提问，我会结合当前题目给你讲解。')}</p></header>
      <div ref={transcript} className="tutor-messages" role="log" aria-label={say('Conversation','讲解对话')}>
        {!messages.length&&<p>{say('Tell me which part is confusing, or choose a question below.','告诉我哪里没懂，或点击下面的问题开始。')}</p>}
        {messages.map((message,index)=><article className={`tutor-message ${message.role}`} key={index}><strong>{message.role==='user'?say('You','你'):say('Tutor','讲解助手')}</strong><p>{message.role==='assistant'?view?.replies[index]?.feedback||message.content:message.content}</p></article>)}
        {busy&&<p role="status">{say('Preparing an explanation…','正在结合题目讲解…')}</p>}
        {translating&&<p role="status">{say('Translating explanations…','正在切换讲解语言…')}</p>}
      </div>
      {error&&<p className="tutor-error" role="alert">{error}</p>}
      {translationError&&<p role="alert">{translationError} <button onClick={retryTranslation}>{say('Retry translation','重试翻译')}</button></p>}
      <div className="tutor-suggestions">{[say('Explain this question step by step.','逐步讲解这道题。'),say('Why do the other options fail?','其他选项为什么不对？'),say('Show me a simpler example.','给我一个更简单的例子。')].map(text=><button disabled={busy} key={text} onClick={()=>setQuestion(text)}>{text}</button>)}</div>
      <form onSubmit={event=>{event.preventDefault();void send();}}><label htmlFor={`tutor-input-${id}`}>{say('Your follow-up question','你的追问')}</label><textarea id={`tutor-input-${id}`} value={question} maxLength={4000} disabled={busy} onChange={event=>setQuestion(event.target.value)} placeholder={say('For example: why is a composite primary key needed?','例如：这里为什么需要联合主键？')}/><div><small>{say('Uses Codex · explanations count as assisted practice.','使用 Codex · 获得讲解会记录为辅助练习。')}</small><button disabled={busy||!question.trim()} type="submit">{say('Send','发送')}</button></div></form>
  </aside>;
}
