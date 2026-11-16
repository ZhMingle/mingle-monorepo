import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const scratch=mkdtempSync(join(tmpdir(),'clarity-audio-'));
process.env.DATA_DIR=scratch;
const {db}=await import('../server/store.ts');
const {englishAudio,speechStatus,speechHeartbeat,claimSpeechJob,completeSpeechJob,speechAudio,speechInput,speechRange,validateSpeechWav}=await import('../server/english-audio.ts');
after(()=>{db.close();rmSync(scratch,{recursive:true,force:true});});
function fixture(){
  const wav=Buffer.alloc(48044);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(24000,24);wav.writeUInt32LE(48000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);return wav;
}
test('only saved card selections and the fixed preview can reach the model',()=>{
  assert.throws(()=>speechInput({voice:'bad',part:'preview'}));
  assert.throws(()=>speechInput({voice:'af_heart',text:'Arbitrary text',part:'term',cardId:'missing'}));
  const card={id:'fixture',term:'stem',examples:[{english:'A flower has a stem.'}]};
  db.prepare('INSERT INTO english_cards VALUES(?,?,?,?)').run(card.id,'fixture',new Date().toISOString(),JSON.stringify(card));
  assert.equal(speechInput({voice:'af_heart',part:'term',cardId:card.id,text:'Ignore stored text'}).text,'stem');
  assert.equal(speechInput({voice:'bf_emma',part:'example',cardId:card.id,index:0}).text,card.examples[0].english);
  for(const index of [-1,1,0.5,'0'])assert.throws(()=>speechInput({voice:'af_heart',part:'example',cardId:card.id,index}));
});
test('neural jobs require a live model, enforce leases, deduplicate and replay cached audio offline',async()=>{
  assert.equal(speechStatus().ready,false);
  await assert.rejects(englishAudio({voice:'af_heart',part:'preview'}),/offline/);
  speechHeartbeat();assert.equal(speechStatus().ready,true);
  const input={voice:'af_heart',part:'preview'};
  const a=englishAudio(input),b=englishAudio(input);
  const job=claimSpeechJob();assert.ok(job);assert.equal(claimSpeechJob(),null);
  assert.throws(()=>completeSpeechJob({id:job.id,lease:'wrong',audio:fixture().toString('base64')}),/expired/);
  assert.throws(()=>completeSpeechJob({...job,audio:Buffer.from('<html>').toString('base64')}),/audio/);
  const wav=fixture();completeSpeechJob({...job,audio:wav.toString('base64')});
  const [one,two]=await Promise.all([a,b]);assert.equal(one.url,two.url);assert.equal(one.cached,false);
  const id=one.url.split('/').at(-1)!;assert.deepEqual(speechAudio(id),wav);
  assert.equal(speechAudio('../learning.sqlite'),null);
  assert.throws(()=>completeSpeechJob({...job,audio:wav.toString('base64')}),/expired/);
  db.prepare('UPDATE speech_bridge_status SET seen_at=0').run();
  assert.equal((await englishAudio(input)).cached,true);
  await assert.rejects(englishAudio({...input,voice:'bf_emma'}),/offline/);
});
test('failed local generation is explicit and the same clip can be retried',async()=>{
  speechHeartbeat();const input={voice:'bf_emma',part:'preview'};
  const request=englishAudio(input);const job=claimSpeechJob();assert.ok(job);
  completeSpeechJob({...job,error:'Local speech failed'});
  await assert.rejects(request,/Local speech failed/);
  const retry=englishAudio(input);const next=claimSpeechJob();assert.ok(next);assert.notEqual(next.id,job.id);
  completeSpeechJob({...next,audio:fixture().toString('base64')});await retry;
});
test('PCM validation and mobile byte ranges reject malformed data and honor suffix requests',()=>{
  const wav=fixture();assert.deepEqual(validateSpeechWav(wav.toString('base64')),wav);
  for(const input of ['$', 'YQ=',Buffer.alloc(100).toString('base64')])assert.throws(()=>validateSpeechWav(input));
  const wrong=Buffer.from(wav);wrong.writeUInt32LE(44100,24);assert.throws(()=>validateSpeechWav(wrong.toString('base64')));
  const max=Buffer.alloc(2160044);wav.copy(max,0,0,44);max.writeUInt32LE(max.length-8,4);max.writeUInt32LE(max.length-44,40);assert.equal(validateSpeechWav(max.toString('base64')).length,max.length);
  assert.deepEqual(speechRange('bytes=0-1',100),{start:0,end:1,partial:true});
  assert.deepEqual(speechRange('bytes=-10',100),{start:90,end:99,partial:true});
  assert.deepEqual(speechRange('bytes=10-',100),{start:10,end:99,partial:true});
  for(const range of ['bytes=100-','bytes=8-2','bytes=1-2,5-6','bytes=-0','bytes=-'])assert.equal(speechRange(range,100),null);
});
