import test from 'node:test';
import assert from 'node:assert/strict';
import {englishVoices,createEnglishSpeaker} from '../src/english-speech.ts';
test('prefers natural English voices and excludes voices in other languages',()=>{
  const voices=[{name:'Microsoft David',lang:'en-US',voiceURI:'david',localService:true},{name:'Microsoft Jenny Online (Natural)',lang:'en-US',voiceURI:'jenny',localService:false},{name:'Chinese Natural',lang:'zh-CN',voiceURI:'zh',localService:false}];
  assert.deepEqual(englishVoices(voices).map(voice=>voice.voiceURI),['jenny','david']);
  assert.equal(voices.length,3);assert.deepEqual(englishVoices([]),[]);
});
test('speech keeps the current utterance, resumes playback and recovers from a rejected voice',t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const spoken:SpeechSynthesisUtterance[]=[];const states:string[]=[];let resumed=0;
  const synth={cancel(){},resume(){resumed++;},getVoices(){return [{name:'Natural',lang:'en-US',voiceURI:'voice',localService:false}];},speak(u:SpeechSynthesisUtterance){spoken.push(u);}} as unknown as SpeechSynthesis;
  const player=createEnglishSpeaker(synth,text=>({text}) as SpeechSynthesisUtterance,state=>states.push(state));
  player.speak('word','voice',1);t.mock.timers.tick(60);
  assert.equal(spoken[0].text,'word');assert.equal(spoken[0].voice?.voiceURI,'voice');assert.equal(resumed,1);
  spoken[0].onerror?.({error:'voice-unavailable'} as SpeechSynthesisErrorEvent);
  t.mock.timers.tick(60);assert.equal(spoken.length,2);assert.equal(spoken[1].voice,undefined);
  spoken[1].onstart?.({} as SpeechSynthesisEvent);assert.equal(states.at(-1),'speaking');
  player.speak('example sentence','',1);t.mock.timers.tick(60);
  spoken[1].onend?.({} as SpeechSynthesisEvent);assert.equal(states.at(-1),'loading');
  spoken[2].onstart?.({} as SpeechSynthesisEvent);spoken[2].onend?.({} as SpeechSynthesisEvent);
  assert.equal(states.at(-1),'idle');player.stop();
});
test('a voice that never starts falls back once and reports failure rather than staying silent',t=>{
  t.mock.timers.enable({apis:['setTimeout']});let calls=0;const states:string[]=[];
  const synth={cancel(){},resume(){},getVoices(){return [];},speak(){calls++;}} as unknown as SpeechSynthesis;
  const player=createEnglishSpeaker(synth,text=>({text}) as SpeechSynthesisUtterance,state=>states.push(state));
  player.speak('test','',1);t.mock.timers.tick(60);t.mock.timers.tick(4000);t.mock.timers.tick(60);t.mock.timers.tick(4000);
  assert.equal(calls,2);assert.equal(states.at(-1),'error');player.stop();
});
