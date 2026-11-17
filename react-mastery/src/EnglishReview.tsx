import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Pause,Play,RotateCcw,X} from 'lucide-react';
import type {ReactNode} from 'react';
import {englishMeaning,englishTitle} from '../shared/english.ts';
import type {EnglishCard} from '../shared/english.ts';
import type {PlaybackState,SpeechSelection} from './english-playback.ts';
import {playbackKey} from './english-playback.ts';
import {reviewQueue} from './english-review.ts';
import NotebookDialog from './NotebookDialog.tsx';
import EnglishAudioButton from './EnglishAudioButton.tsx';
import {useLanguage} from './language.tsx';
import './english-review.css';

function settings(){try{const saved=JSON.parse(localStorage.getItem('clarity.englishReview')??'{}');return {repetitions:Number.isInteger(saved.repetitions)&&saved.repetitions>=1&&saved.repetitions<=20?saved.repetitions:3,automatic:saved.automatic===true};}catch{return {repetitions:3,automatic:false};}}
export default function EnglishReview({cards,numbers,initialId,playback,feedback,onSequence,onStop,onExit}:{cards:EnglishCard[];numbers:Map<string,number>;initialId:string;playback:PlaybackState;feedback:ReactNode;onSequence:(items:SpeechSelection[])=>void;onStop:()=>void;onExit:()=>void}){
  const {language}=useLanguage(),zh=language==='zh',text=(cn:string,en:string)=>zh?cn:en;
  const [preferences,setPreferences]=useState(settings),[index,setIndex]=useState(()=>Math.max(0,cards.findIndex(card=>card.id===initialId))),[completed,setCompleted]=useState(0),[revealed,setRevealed]=useState(false),[paused,setPaused]=useState(false);
  const card=cards[index],current=playback.cardId===card.id&&playback.iteration!==undefined;
  const active=current&&['loading','speaking','done'].includes(playback.phase);
  const completedNow=current&&playback.phase==='done'?playback.iteration!:completed;
  const end=completedNow>=preferences.repetitions;
  const latest=useRef({onStop});latest.current={onStop};
  function start(position=index,options=preferences,firstRepeat=1){setIndex(position);setCompleted(firstRepeat-1);setPaused(false);setRevealed(false);onSequence(reviewQueue(cards,position,options.repetitions,options.automatic,firstRepeat));}
  useEffect(()=>{start();return()=>latest.current.onStop();},[]);
  useEffect(()=>{
    if(playback.iteration===undefined)return;
    const position=cards.findIndex(card=>card.id===playback.cardId);if(position<0)return;
    if(position!==index){setIndex(position);setRevealed(false);}
    if(playback.phase==='done')setCompleted(playback.iteration);
    else if(playback.phase==='loading')setCompleted(playback.iteration-1);
  },[playback.cardId,playback.iteration,playback.phase]);
  function configure(patch:Partial<typeof preferences>){const next={...preferences,...patch};setPreferences(next);try{localStorage.setItem('clarity.englishReview',JSON.stringify(next));}catch{}start(index,next);}
  function toggle(){if(active){onStop();setPaused(true);}else start(index,preferences,end?1:Math.min(preferences.repetitions,completed+1));}
  return <NotebookDialog className="english-review" labelledBy="english-review-title" onDismiss={onExit}>
    <header className="english-review-header"><div><h2 id="english-review-title">{text('过卡片','Card review')}</h2><span>{index+1} / {cards.length}</span></div><button className="secondary" onClick={onExit}><X size={18}/>{text('退出','Exit')}</button></header>
    <div className="english-review-settings"><label>{text('每张读','Read each card')} <input aria-label={text('每张朗读遍数','Readings per card')} type="number" min={1} max={20} value={preferences.repetitions} onChange={event=>{const value=Number(event.target.value);if(Number.isInteger(value)&&value>=1&&value<=20)configure({repetitions:value});}}/> {text('遍','times')}</label><label>{text('切换方式','Advance')} <select aria-label={text('卡片切换方式','Card advance mode')} value={preferences.automatic?'auto':'manual'} onChange={event=>configure({automatic:event.target.value==='auto'})}><option value="manual">{text('自己点击下一张','I click Next')}</option><option value="auto">{text('读完自动下一张','Next after reading')}</option></select></label></div>
    {feedback}
    <main className="english-review-body"><article className="english-review-card"><div className="english-review-ordinal">{numbers.get(card.id)} · {card.term} {card.partOfSpeech&&<span>{card.partOfSpeech}</span>}</div><h3 lang="en">{englishTitle(card)}</h3><div className="english-review-audio-row"><EnglishAudioButton playback={playback} target={playbackKey(card.id,'term')} label={text('播放或停止当前语块','Play or stop this chunk')} size={22} onClick={toggle}/><span role="status">{current&&playback.phase==='loading'?text(`准备第 ${playback.iteration} / ${preferences.repetitions} 遍…`,`Preparing ${playback.iteration} / ${preferences.repetitions}…`):current&&playback.phase==='speaking'?text(`朗读第 ${playback.iteration} / ${preferences.repetitions} 遍`,`Reading ${playback.iteration} / ${preferences.repetitions}`):paused?text('已暂停','Paused'):end?text(preferences.automatic&&index===cards.length-1?'本轮已完成':'本张已读完','Reading complete'):text(`已读 ${completedNow} / ${preferences.repetitions} 遍`,`Read ${completedNow} / ${preferences.repetitions}`)}</span></div><button className="english-review-reveal" aria-expanded={revealed} onClick={()=>setRevealed(!revealed)}>{revealed?text('隐藏释义与速记','Hide meaning & memory cue'):text('显示释义与速记','Show meaning & memory cue')}</button><div className="english-review-answer" data-revealed={revealed}><p>{englishMeaning(card)}</p>{card.memory&&<p className="english-review-memory">{card.memory.association}</p>}</div></article></main>
    <footer className="english-review-controls"><button className="secondary" disabled={index===0} onClick={()=>start(index-1)}><ArrowLeft size={18}/>{text('上一张','Previous')}</button><button className="secondary" onClick={toggle}>{active?<Pause size={18}/>:<Play size={18}/>} {active?text('暂停','Pause'):text(end?'重读本张':'继续朗读',end?'Read again':'Continue')}</button><button className="secondary" onClick={()=>start(index===cards.length-1?0:index)}><RotateCcw size={17}/>{text(index===cards.length-1?'从头开始':'重新读',index===cards.length-1?'Start over':'Restart')}</button><button className="dark-button" disabled={index===cards.length-1} onClick={()=>start(index+1)}>{text('下一张','Next')}<ArrowRight size={18}/></button></footer>
  </NotebookDialog>;
}
