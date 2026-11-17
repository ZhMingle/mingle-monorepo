import {createEnglishSpeaker} from './english-speech.ts';
import type {SpeechClip} from '../shared/english-audio.ts';

export type PlaybackPhase='idle'|'loading'|'speaking'|'ready'|'done'|'error';
export type PlaybackState={key:string|null;label:string;phase:PlaybackPhase;cardId?:string;part?:SpeechSelection['part'];iteration?:number;repetitions?:number;failure?:'request'|'audio'|'timeout'|'unsupported';error?:string};
export type SpeechSelection={key:string;text:string;label?:string;cardId?:string;part:'term'|'example'|'preview'|'reminder';index?:number;reminderId?:string;iteration?:number;repetitions?:number};
type SpeechOptions={engine:'neural'|'browser';voice:string;rate:number};
type AudioPort=Pick<HTMLAudioElement,'src'|'playbackRate'|'play'|'pause'|'onplaying'|'onwaiting'|'onended'|'onerror'|'onpause'>;
export const idlePlayback:PlaybackState={key:null,label:'',phase:'idle'};
export const playbackKey=(cardId:string|undefined,part:'term'|'example'|'preview',index?:number)=>JSON.stringify([cardId??'',part,index??null]);

export function createEnglishPlayback({loadClip,prepare,createAudio,synth,createUtterance,onChange}:{
  loadClip:(selection:SpeechSelection,voice:string,signal:AbortSignal)=>Promise<SpeechClip>;
  prepare?:(selection:SpeechSelection,signal:AbortSignal)=>Promise<SpeechSelection>;
  createAudio:()=>AudioPort;synth?:SpeechSynthesis;createUtterance:(text:string)=>SpeechSynthesisUtterance;onChange:(state:PlaybackState)=>void;
}){
  let state={...idlePlayback},generation=0,disposed=false;
  let audio:AudioPort|null=null,request:AbortController|null=null,speaker:ReturnType<typeof createEnglishSpeaker>|null=null;
  let timer:ReturnType<typeof setTimeout>|undefined;
  let last:{selection:SpeechSelection;options:SpeechOptions}|null=null;
  let queue:{selection:SpeechSelection;options:SpeechOptions}[]=[];
  function publish(next:PlaybackState){state=next;if(!disposed)onChange(next);}
  function clearTimer(){if(timer)clearTimeout(timer);timer=undefined;}
  function releaseAudio(){if(audio){audio.onplaying=audio.onwaiting=audio.onended=audio.onerror=audio.onpause=null;audio.pause();audio=null;}}
  function cancel(){generation++;clearTimer();request?.abort();request=null;speaker?.stop();speaker=null;releaseAudio();}
  function stop(){queue=[];cancel();publish({...idlePlayback});}
  function valid(ticket:number){return !disposed&&ticket===generation;}
  function fail(ticket:number,failure:NonNullable<PlaybackState['failure']>,error?:string){
    if(!valid(ticket))return;const previous=state;queue=[];cancel();publish({...previous,phase:'error',failure,error});
  }
  function deadline(ticket:number,ms:number){clearTimer();timer=setTimeout(()=>fail(ticket,'timeout'),ms);}
  function finished(ticket:number){
    if(!valid(ticket))return;clearTimer();releaseAudio();publish({...state,phase:'done'});
    timer=setTimeout(()=>{if(!valid(ticket))return;const next=queue.shift();if(next)void start(next.selection,next.options);else publish({...idlePlayback});},900);
  }
  function play(ticket:number,current:AudioPort){
    deadline(ticket,20000);
    try{
      void current.play().catch(cause=>{
        if(!valid(ticket)||audio!==current)return;clearTimer();
        if((cause as Error).name==='NotAllowedError')publish({...state,phase:'ready'});
        else fail(ticket,'audio');
      });
    }catch{fail(ticket,'audio');}
  }
  async function start(selection:SpeechSelection,options:SpeechOptions){
    cancel();last={selection:{...selection},options:{...options}};const ticket=generation;
    publish({key:selection.key,label:selection.label??selection.text,cardId:selection.cardId,part:selection.part,iteration:selection.iteration,repetitions:selection.repetitions,phase:'loading'});
    const pending=new AbortController();request=pending;
    try{
      if(selection.part==='reminder'&&!selection.reminderId){
        if(!prepare)throw Error('Reminder preparation is unavailable.');
        deadline(ticket,240000);selection=await prepare(selection,pending.signal);
        if(!valid(ticket))return;last.selection=selection;
      }
      if(options.engine==='browser'){
        clearTimer();request=null;
        if(!synth){fail(ticket,'unsupported');return;}
        let began=false;
        speaker=createEnglishSpeaker(synth,createUtterance,(phase,error)=>{
          if(!valid(ticket))return;
          if(phase==='speaking')began=true;
          if(phase==='idle'){if(began)finished(ticket);}
          else if(phase==='error')fail(ticket,'audio',error);
          else publish({...state,phase});
        });
        speaker.speak(selection.text,options.voice,options.rate);return;
      }
      deadline(ticket,130000);
      const clip=await loadClip(selection,options.voice,pending.signal);
      if(!valid(ticket))return;clearTimer();request=null;
      const current=createAudio();audio=current;current.src=clip.url;current.playbackRate=last.options.rate;
      current.onplaying=()=>{if(valid(ticket)&&audio===current){clearTimer();publish({...state,phase:'speaking'});}};
      current.onwaiting=()=>{if(valid(ticket)&&audio===current){publish({...state,phase:'loading'});deadline(ticket,20000);}};
      current.onended=()=>finished(ticket);
      current.onerror=()=>fail(ticket,'audio');
      current.onpause=()=>{if(valid(ticket)&&audio===current){clearTimer();publish({...state,phase:'ready'});}};
      play(ticket,current);
    }catch(cause){if(valid(ticket)&&!pending.signal.aborted)fail(ticket,'request',(cause as Error).message);}
  }
  function toggle(selection:SpeechSelection,options:SpeechOptions){
    if(disposed)return;
    if(state.key===selection.key){
      if(state.phase==='loading'||state.phase==='speaking'){stop();return;}
      if(state.phase==='ready'&&audio){publish({...state,phase:'loading'});play(generation,audio);return;}
    }
    queue=[];
    void start(selection,options);
  }
  return {toggle,stop,sequence(selections:SpeechSelection[],options:SpeechOptions){if(disposed||!selections.length)return;queue=selections.slice(1).map(selection=>({selection,options:{...options}}));void start(selections[0],options);},retry(){if(last&&!disposed)toggle(last.selection,last.options);},setRate(rate:number){if(audio)audio.playbackRate=rate;if(last)last.options.rate=rate;for(const item of queue)item.options.rate=rate;},getState:()=>state,dispose(){disposed=true;queue=[];cancel();}};
}
