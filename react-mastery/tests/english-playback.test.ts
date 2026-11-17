import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEnglishPlayback} from '../src/english-playback.ts';
import type {PlaybackState,SpeechSelection} from '../src/english-playback.ts';
import {reviewQueue} from '../src/english-review.ts';
import type {EnglishCard} from '../shared/english.ts';

const selection:SpeechSelection={key:'card-a-term',cardId:'a',part:'term',text:'stem'};
const options={engine:'neural' as const,voice:'af_heart',rate:1};
const clip={url:'/api/english/speech/audio/fixture',voice:'af_heart' as const,cached:false};
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
function fakeAudio(){
  let plays=0,pauses=0;
  const audio={src:'',playbackRate:1,onplaying:null as (()=>void)|null,onwaiting:null as (()=>void)|null,onended:null as (()=>void)|null,onerror:null as (()=>void)|null,onpause:null as (()=>void)|null,play:async()=>{plays++;},pause(){pauses++;}};
  return {audio,port:audio as unknown as HTMLAudioElement,plays:()=>plays,pauses:()=>pauses};
}

test('a second click cancels preparation and late results cannot start audio',async()=>{
  let resolve!:(value:typeof clip)=>void,signal!:AbortSignal,created=0;
  const states:PlaybackState[]=[];
  const player=createEnglishPlayback({loadClip:(_selection,_voice,input)=>{signal=input;return new Promise(done=>resolve=done);},createAudio:()=>{created++;return fakeAudio().port;},createUtterance:()=>({}) as SpeechSynthesisUtterance,onChange:state=>states.push(state)});
  player.toggle(selection,options);assert.equal(player.getState().phase,'loading');assert.equal(player.getState().key,selection.key);
  player.toggle(selection,options);assert.equal(player.getState().phase,'idle');assert.equal(signal.aborted,true);
  resolve(clip);await flush();assert.equal(created,0);assert.equal(states.at(-1)?.phase,'idle');player.dispose();
});

test('feedback follows actual media events, including buffering and completion',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});const media=fakeAudio();
  const player=createEnglishPlayback({loadClip:async()=>clip,createAudio:()=>media.port,createUtterance:()=>({}) as SpeechSynthesisUtterance,onChange(){}});
  player.toggle(selection,options);await flush();assert.equal(media.plays(),1);assert.equal(player.getState().phase,'loading');
  media.audio.onplaying?.();assert.equal(player.getState().phase,'speaking');
  media.audio.onwaiting?.();assert.equal(player.getState().phase,'loading');
  media.audio.onplaying?.();assert.equal(player.getState().phase,'speaking');
  player.setRate(.85);assert.equal(media.audio.playbackRate,.85);
  media.audio.onended?.();assert.equal(player.getState().phase,'done');t.mock.timers.tick(900);assert.equal(player.getState().phase,'idle');player.dispose();
});

test('switching cards stops old audio and ignores its later events',async()=>{
  const first=fakeAudio(),second=fakeAudio();let created=0;
  const requests:string[]=[];
  const player=createEnglishPlayback({loadClip:async item=>{requests.push(item.cardId!);return clip;},createAudio:()=>created++?second.port:first.port,createUtterance:()=>({}) as SpeechSynthesisUtterance,onChange(){}});
  player.toggle(selection,options);await flush();first.audio.onplaying?.();const oldEnd=first.audio.onended;
  player.toggle({...selection,key:'card-b-example',cardId:'b',part:'example',index:1,text:'A new sentence.'},options);await flush();
  assert.equal(first.pauses(),1);assert.deepEqual(requests,['a','b']);oldEnd?.();assert.equal(player.getState().key,'card-b-example');assert.equal(player.getState().phase,'loading');
  second.audio.onplaying?.();player.toggle({...selection,key:'card-b-example',cardId:'b',part:'example',index:1},options);
  assert.equal(second.pauses(),1);assert.equal(player.getState().phase,'idle');player.dispose();
});

test('autoplay blocking offers a direct second tap without regenerating the clip',async()=>{
  const media=fakeAudio();let calls=0,attempts=0;
  media.audio.play=async()=>{attempts++;if(attempts===1)throw Object.assign(new Error('blocked'),{name:'NotAllowedError'});};
  const player=createEnglishPlayback({loadClip:async()=>{calls++;return clip;},createAudio:()=>media.port,createUtterance:()=>({}) as SpeechSynthesisUtterance,onChange(){}});
  player.toggle(selection,options);await flush();assert.equal(player.getState().phase,'ready');
  player.retry();assert.equal(attempts,2);await flush();media.audio.onplaying?.();assert.equal(player.getState().phase,'speaking');assert.equal(calls,1);player.dispose();
});

test('failed requests and stalled media report errors and allow retry',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});const media=fakeAudio();let calls=0;
  const player=createEnglishPlayback({loadClip:async()=>{if(calls++===0)throw Error('Computer offline');return clip;},createAudio:()=>media.port,createUtterance:()=>({}) as SpeechSynthesisUtterance,onChange(){}});
  player.toggle(selection,options);await flush();assert.equal(player.getState().phase,'error');assert.equal(player.getState().error,'Computer offline');
  player.retry();await flush();assert.equal(player.getState().phase,'loading');t.mock.timers.tick(20000);assert.equal(player.getState().phase,'error');assert.equal(player.getState().failure,'timeout');
  player.retry();await flush();media.audio.onplaying?.();media.audio.onerror?.();assert.equal(player.getState().failure,'audio');player.dispose();
});

test('dispose aborts requests and prevents notifications or playback after unmount',async()=>{
  let resolve!:(value:typeof clip)=>void,created=0;const states:PlaybackState[]=[];
  const player=createEnglishPlayback({loadClip:()=>new Promise(done=>resolve=done),createAudio:()=>{created++;return fakeAudio().port;},createUtterance:()=>({}) as SpeechSynthesisUtterance,onChange:state=>states.push(state)});
  player.toggle(selection,options);player.dispose();resolve(clip);await flush();assert.equal(created,0);assert.equal(states.length,1);
  player.toggle(selection,options);assert.equal(states.length,1);
});

test('browser speech startup idle is not a completed reading and stopping is not completion',t=>{
  t.mock.timers.enable({apis:['setTimeout']});let utterance!:SpeechSynthesisUtterance;
  const synth={cancel(){},resume(){},getVoices(){return [{name:'English',lang:'en-US',voiceURI:'test',localService:true}];},speak(value:SpeechSynthesisUtterance){utterance=value;}} as unknown as SpeechSynthesis;
  const player=createEnglishPlayback({loadClip:async()=>clip,createAudio:()=>fakeAudio().port,synth,createUtterance:text=>({text}) as SpeechSynthesisUtterance,onChange(){}});
  player.toggle(selection,{...options,engine:'browser'});assert.equal(player.getState().phase,'loading');t.mock.timers.tick(60);
  utterance.onstart?.({} as SpeechSynthesisEvent);assert.equal(player.getState().phase,'speaking');
  player.toggle(selection,{...options,engine:'browser'});assert.equal(player.getState().phase,'idle');
  player.toggle(selection,{...options,engine:'browser'});t.mock.timers.tick(60);utterance.onstart?.({} as SpeechSynthesisEvent);utterance.onend?.({} as SpeechSynthesisEvent);assert.equal(player.getState().phase,'done');player.dispose();
});

test('duplicate reminders prepare saved speech, play serially and stop cancels the remaining queue',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});const media=fakeAudio();const prepared:string[]=[],loaded:string[]=[];
  const reminder={...selection,part:'reminder' as const,label:'stem'};
  const player=createEnglishPlayback({prepare:async item=>{prepared.push(item.cardId!);return {...item,reminderId:'server-message',text:'You saved it already. It means a plant stalk.'};},loadClip:async item=>{loaded.push(item.text);assert.equal(item.reminderId,'server-message');return clip;},createAudio:()=>media.port,createUtterance:()=>({}) as SpeechSynthesisUtterance,onChange(){}});
  player.sequence([reminder,{...reminder,key:'second',cardId:'b'},{...reminder,key:'third',cardId:'c'}],options);await flush();
  assert.deepEqual(prepared,['a']);assert.equal(player.getState().label,'stem');assert.match(loaded[0],/It means/);
  media.audio.onplaying?.();media.audio.onended?.();t.mock.timers.tick(900);await flush();
  assert.deepEqual(prepared,['a','b']);assert.equal(player.getState().key,'second');
  player.stop();t.mock.timers.tick(10000);await flush();assert.equal(prepared.length,2);assert.equal(player.getState().phase,'idle');player.dispose();
});

test('cancelled definition preparation never starts speech, and browser reminders use prepared English',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});let resolve!:(item:SpeechSelection)=>void,signal!:AbortSignal;let reads=0;
  const reminder={...selection,part:'reminder' as const};
  const player=createEnglishPlayback({prepare:(_item,input)=>{signal=input;return new Promise(done=>resolve=done);},loadClip:async()=>{reads++;return clip;},createAudio:()=>fakeAudio().port,createUtterance:()=>({}) as SpeechSynthesisUtterance,onChange(){}});
  player.sequence([reminder,reminder],options);player.stop();resolve({...reminder,text:'Late reminder.',reminderId:'late'});await flush();assert.equal(signal.aborted,true);assert.equal(reads,0);player.dispose();
  let spoken='';const synth={cancel(){},resume(){},getVoices(){return [{name:'English',lang:'en-US',voiceURI:'test',localService:true}];},speak(value:SpeechSynthesisUtterance){spoken=value.text;}} as unknown as SpeechSynthesis;
  const browser=createEnglishPlayback({prepare:async item=>({...item,text:'Already forgotten? It means a plant stalk.',reminderId:'saved'}),loadClip:async()=>{throw Error('Browser speech must not request neural audio');},createAudio:()=>fakeAudio().port,synth,createUtterance:text=>({text}) as SpeechSynthesisUtterance,onChange(){}});
  browser.sequence([reminder],{...options,engine:'browser'});await flush();t.mock.timers.tick(60);assert.match(spoken,/It means a plant stalk/);browser.dispose();
});

test('automatic review advances only after three real endings and stops at the final card',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});let media=fakeAudio();const starts:string[]=[];
  const player=createEnglishPlayback({loadClip:async()=>clip,createAudio:()=>{media=fakeAudio();return media.port;},createUtterance:()=>({}) as SpeechSynthesisUtterance,onChange:state=>{if(state.phase==='loading')starts.push(`${state.cardId}:${state.iteration}`);}});
  player.sequence(reviewQueue([{id:'a',term:'a word'},{id:'b',term:'another word'}] as EnglishCard[],0,3,true),options);await flush();
  for(let index=0;index<6;index++){assert.equal(player.getState().phase,'loading');assert.equal(player.getState().cardId,index<3?'a':'b');assert.equal(player.getState().iteration,index%3+1);media.audio.onplaying?.();t.mock.timers.tick(100);assert.equal(player.getState().phase,'speaking');media.audio.onended?.();t.mock.timers.tick(900);await flush();}
  assert.deepEqual(starts,['a:1','a:2','a:3','b:1','b:2','b:3']);assert.equal(player.getState().phase,'idle');player.dispose();
});
