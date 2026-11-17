import {AlertCircle,Check,Headphones,LoaderCircle,Play,X} from 'lucide-react';
import type {ReactNode} from 'react';
import {useLanguage} from './language.tsx';
import type {PlaybackState} from './english-playback.ts';
import './english-audio-feedback.css';

export default function EnglishAudioButton({playback,target,label,onClick,className='english-audio',size=16,children}:{playback:PlaybackState;target:string;label:string;onClick:()=>void;className?:string;size?:number;children?:ReactNode}){
  const {language}=useLanguage();const text=(cn:string,en:string)=>language==='zh'?cn:en;
  const phase=playback.key===target?playback.phase:'idle';
  const busy=phase==='loading'||phase==='speaking';
  const hint=({idle:text('点击朗读','Read aloud'),loading:text('正在准备语音，再点取消','Preparing audio; click to cancel'),speaking:text('正在朗读，再点停止','Speaking; click to stop'),ready:text('语音已就绪，点击播放','Audio ready; click to play'),done:text('朗读完成，可再次播放','Finished; click to replay'),error:text('播放失败，点击重试','Playback failed; click to retry')})[phase];
  return <button type="button" className={`${className} english-speech-button`} data-audio-state={phase} aria-label={label} aria-description={hint} aria-pressed={busy||phase==='ready'} aria-busy={phase==='loading'} title={`${label} · ${hint}`} onClick={onClick}>
    {phase==='loading'?<LoaderCircle size={size} className="english-audio-spinner"/>:phase==='speaking'?<span className="english-audio-wave" style={{width:size,height:size}} aria-hidden="true"><i/><i/><i/><i/></span>:phase==='ready'?<Play size={size}/>:phase==='done'?<Check size={size}/>:phase==='error'?<AlertCircle size={size}/>:<Headphones size={size}/>}{children}
  </button>;
}

export function EnglishPlaybackNotice({playback,onRetry,onDismiss}:{playback:PlaybackState;onRetry:()=>void;onDismiss:()=>void}){
  const {language}=useLanguage();const text=(cn:string,en:string)=>language==='zh'?cn:en;
  const spoken=playback.phase==='loading'?text(`正在准备语音：${playback.label}`,`Preparing audio: ${playback.label}`):playback.phase==='speaking'?text(`正在朗读：${playback.label}`,`Speaking: ${playback.label}`):playback.phase==='done'?text('朗读完成','Finished reading'):'';
  const message=playback.phase==='ready'?text('语音已准备好，请点击播放。','Audio is ready. Tap Play to continue.'):playback.failure==='request'?playback.error??text('语音连接失败，请重试。','Speech connection failed. Please retry.'):playback.failure==='timeout'?text('语音等待超时，请重试。','Speech timed out. Please retry.'):playback.failure==='unsupported'?text('当前浏览器不支持此朗读方式。','This speech source is unavailable in your browser.'):text('音频未能播放，请重试。','Audio could not play. Please retry.');
  return <><span className="english-audio-sr" role="status" aria-live="polite">{spoken}</span>{(playback.phase==='error'||playback.phase==='ready')&&<aside className="english-audio-notice" role={playback.phase==='error'?'alert':'status'}><span>{message}</span><button onClick={onRetry}>{playback.phase==='ready'?text('播放','Play'):text('重试','Retry')}</button><button className="english-audio-notice-close" onClick={onDismiss} aria-label={text('关闭语音提示','Dismiss speech notice')}><X size={16}/></button></aside>}</>;
}
