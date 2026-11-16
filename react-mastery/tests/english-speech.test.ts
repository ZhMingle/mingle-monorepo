import test from 'node:test';
import assert from 'node:assert/strict';
import {englishVoices,createEnglishSpeaker} from '../src/english-speech.ts';
test('prefers natural English voices and excludes voices in other languages',()=>{
  const voices=[{name:'Microsoft David',lang:'en-US',voiceURI:'david',localService:true},{name:'Microsoft Jenny Online (Natural)',lang:'en-US',voiceURI:'jenny',localService:false},{name:'Chinese Natural',lang:'zh-CN',voiceURI:'zh',localService:false}];
  assert.deepEqual(englishVoices(voices).map(voice=>voice.voiceURI),['jenny','david']);
  assert.equal(voices.length,3);assert.deepEqual(englishVoices([]),[]);
});
test('speech retries another natural English voice rather than the unspecified system default',t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const spoken:SpeechSynthesisUtterance[]=[];const states:string[]=[];let resumed=0;
  const used:string[]=[];
  const synth={cancel(){},resume(){resumed++;},getVoices(){return [{name:'A Natural',lang:'en-US',voiceURI:'voice',localService:false},{name:'B Natural',lang:'en-US',voiceURI:'backup',localService:false},{name:'Microsoft David',lang:'en-US',voiceURI:'david',localService:true}];},speak(u:SpeechSynthesisUtterance){spoken.push(u);}} as unknown as SpeechSynthesis;
  const player=createEnglishSpeaker(synth,text=>({text}) as SpeechSynthesisUtterance,state=>states.push(state),(voice,fallback)=>used.push(`${voice?.voiceURI}:${fallback}`));
  player.speak('word','voice',1);t.mock.timers.tick(60);
  assert.equal(spoken[0].text,'word');assert.equal(spoken[0].voice?.voiceURI,'voice');assert.equal(resumed,1);
  spoken[0].onerror?.({error:'voice-unavailable'} as SpeechSynthesisErrorEvent);
  t.mock.timers.tick(60);assert.equal(spoken.length,2);assert.equal(spoken[1].voice?.voiceURI,'backup');
  spoken[1].onstart?.({} as SpeechSynthesisEvent);assert.equal(states.at(-1),'speaking');
  assert.deepEqual(used,['backup:true']);
  player.speak('example sentence','',1);t.mock.timers.tick(60);
  spoken[1].onend?.({} as SpeechSynthesisEvent);assert.equal(states.at(-1),'loading');
  spoken[2].onstart?.({} as SpeechSynthesisEvent);spoken[2].onend?.({} as SpeechSynthesisEvent);
  assert.equal(states.at(-1),'idle');player.stop();
});
test('a slow online voice gets time to start and a stopped request cannot switch voices later',t=>{
  t.mock.timers.enable({apis:['setTimeout']});const spoken:SpeechSynthesisUtterance[]=[];
  const synth={cancel(){},resume(){},getVoices(){return [{name:'Online Natural',lang:'en-US',voiceURI:'natural',localService:false},{name:'System',lang:'en-US',voiceURI:'system',localService:true}];},speak(u:SpeechSynthesisUtterance){spoken.push(u);}} as unknown as SpeechSynthesis;
  const player=createEnglishSpeaker(synth,text=>({text}) as SpeechSynthesisUtterance,()=>{});
  player.speak('A full sentence.','',1);t.mock.timers.tick(60);t.mock.timers.tick(4000);assert.equal(spoken.length,1);
  t.mock.timers.tick(8000);t.mock.timers.tick(60);assert.equal(spoken[1].voice?.voiceURI,'system');
  player.stop();spoken[1].onerror?.({error:'interrupted'} as SpeechSynthesisErrorEvent);t.mock.timers.tick(12000);assert.equal(spoken.length,2);
});

test('the first click waits for English voices and stopping removes the pending inventory listener',t=>{
  t.mock.timers.enable({apis:['setTimeout']});let ready=false;const listeners=new Set<()=>void>();const spoken:SpeechSynthesisUtterance[]=[];
  const synth={cancel(){},resume(){},getVoices(){return ready?[{name:'Natural',lang:'en-US',voiceURI:'late',localService:false}]:[];},speak(u:SpeechSynthesisUtterance){spoken.push(u);},addEventListener(_name:string,listener:()=>void){listeners.add(listener);},removeEventListener(_name:string,listener:()=>void){listeners.delete(listener);}} as unknown as SpeechSynthesis;
  const player=createEnglishSpeaker(synth,text=>({text}) as SpeechSynthesisUtterance,()=>{});
  player.speak('test','',1);assert.equal(spoken.length,0);t.mock.timers.tick(500);ready=true;for(const listener of listeners)listener();t.mock.timers.tick(60);
  assert.equal(spoken[0].voice?.voiceURI,'late');assert.equal(listeners.size,0);
  ready=false;player.speak('cancel me','',1);player.stop();assert.equal(listeners.size,0);t.mock.timers.tick(2000);assert.equal(spoken.length,1);
});

test('no available English voice reports failure after one bounded default attempt',t=>{
  t.mock.timers.enable({apis:['setTimeout']});let calls=0;const states:string[]=[];
  const synth={cancel(){},resume(){},getVoices(){return [];},speak(){calls++;},addEventListener(){},removeEventListener(){}} as unknown as SpeechSynthesis;
  const player=createEnglishSpeaker(synth,text=>({text}) as SpeechSynthesisUtterance,state=>states.push(state));
  player.speak('test','',1);t.mock.timers.tick(1500);t.mock.timers.tick(60);t.mock.timers.tick(4000);
  assert.equal(calls,1);assert.equal(states.at(-1),'error');player.stop();
});
