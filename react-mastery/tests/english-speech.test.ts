import test from 'node:test';
import assert from 'node:assert/strict';
import {englishVoices} from '../src/english-speech.ts';
test('prefers natural English voices and excludes voices in other languages',()=>{
  const voices=[{name:'Microsoft David',lang:'en-US',voiceURI:'david',localService:true},{name:'Microsoft Jenny Online (Natural)',lang:'en-US',voiceURI:'jenny',localService:false},{name:'Chinese Natural',lang:'zh-CN',voiceURI:'zh',localService:false}];
  assert.deepEqual(englishVoices(voices).map(voice=>voice.voiceURI),['jenny','david']);
  assert.equal(voices.length,3);assert.deepEqual(englishVoices([]),[]);
});
