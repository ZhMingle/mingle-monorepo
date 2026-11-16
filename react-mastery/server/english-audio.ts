import {createHash,randomUUID} from 'node:crypto';
import {db} from './store.ts';
import {englishCards} from './english.ts';
import {speechModel,speechPreview,validSpeechVoice,type SpeechVoice} from '../shared/english-audio.ts';

db.exec(`CREATE TABLE IF NOT EXISTS speech_cache(id TEXT PRIMARY KEY,voice TEXT NOT NULL,audio BLOB NOT NULL,used_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS speech_jobs(id TEXT PRIMARY KEY,cache_id TEXT NOT NULL,text TEXT NOT NULL,voice TEXT NOT NULL,state TEXT NOT NULL,deadline INTEGER NOT NULL,lease TEXT,error TEXT);
CREATE TABLE IF NOT EXISTS speech_bridge_status(id INTEGER PRIMARY KEY CHECK(id=1),seen_at INTEGER NOT NULL);`);
const fail=(message:string,status=400)=>Object.assign(new Error(message),{status});
export function speechHeartbeat(){db.prepare('INSERT INTO speech_bridge_status VALUES(1,?) ON CONFLICT(id) DO UPDATE SET seen_at=excluded.seen_at').run(Date.now());}
export function speechStatus(){return {ready:Number((db.prepare('SELECT seen_at FROM speech_bridge_status WHERE id=1').get() as {seen_at:number}|undefined)?.seen_at??0)>Date.now()-30000,model:speechModel};}
export function speechInput(input:Record<string,unknown>){
  if(!validSpeechVoice(input.voice))throw fail('请选择有效的自然语音。 / Choose a valid neural voice.');
  if(input.part==='preview')return {text:speechPreview,voice:input.voice};
  const card=englishCards().find(card=>card.id===input.cardId);
  if(!card)throw fail('这张卡片不存在，请刷新列表。 / Card not found.',404);
  let text:string|undefined;
  if(input.part==='term')text=card.term;
  else if(input.part==='example'&&Number.isInteger(input.index)&&Number(input.index)>=0)text=card.examples[Number(input.index)]?.english;
  if(!text?.trim()||text.length>300)throw fail('无效的朗读内容。 / Invalid speech selection.');
  return {text,voice:input.voice};
}
export function validateSpeechWav(value:unknown):Buffer{
  if(typeof value!=='string'||value.length>2880060||value.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))throw fail('Invalid speech audio.');
  const wav=Buffer.from(value,'base64');
  if(wav.length<46||wav.length>2160044||wav.toString('ascii',0,4)!=='RIFF'||wav.readUInt32LE(4)!==wav.length-8||wav.toString('ascii',8,16)!=='WAVEfmt '||wav.readUInt32LE(16)!==16||wav.readUInt16LE(20)!==1||wav.readUInt16LE(22)!==1||wav.readUInt32LE(24)!==24000||wav.readUInt32LE(28)!==48000||wav.readUInt16LE(32)!==2||wav.readUInt16LE(34)!==16||wav.toString('ascii',36,40)!=='data'||wav.readUInt32LE(40)!==wav.length-44||(wav.length-44)%2)throw fail('Invalid PCM speech audio.');
  return wav;
}
export function speechAudio(id:string){
  if(!/^[a-f0-9]{64}$/.test(id))return null;
  const row=db.prepare('SELECT audio FROM speech_cache WHERE id=?').get(id) as {audio:Uint8Array}|undefined;
  if(row)db.prepare('UPDATE speech_cache SET used_at=? WHERE id=?').run(Date.now(),id);
  return row?Buffer.from(row.audio):null;
}
function cacheAudio(id:string,voice:SpeechVoice,audio:Buffer){
  db.prepare('INSERT OR REPLACE INTO speech_cache VALUES(?,?,?,?)').run(id,voice,audio,Date.now());
  const rows=db.prepare('SELECT id,length(audio) AS size FROM speech_cache ORDER BY used_at DESC').all() as {id:string;size:number}[];
  let total=0;rows.forEach((row,index)=>{total+=row.size;if(index>=120||total>32*1024*1024)db.prepare('DELETE FROM speech_cache WHERE id=?').run(row.id);});
}
export function speechRange(header:string|undefined,length:number){
  if(!header)return {start:0,end:length-1,partial:false};
  const match=/^bytes=(\d*)-(\d*)$/.exec(header);
  if(!match||!match[1]&&!match[2])return null;
  const start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2]));
  const end=match[1]&&match[2]?Math.min(length-1,Number(match[2])):length-1;
  return Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=0&&start<=end&&start<length?{start,end,partial:true}:null;
}
export function claimSpeechJob(){
  speechHeartbeat();const now=Date.now();
  db.prepare('DELETE FROM speech_jobs WHERE deadline<?').run(now-300000);
  const job=db.prepare("SELECT id,text,voice FROM speech_jobs WHERE state='queued' AND deadline>? ORDER BY rowid LIMIT 1").get(now) as {id:string;text:string;voice:SpeechVoice}|undefined;
  if(!job)return null;const lease=randomUUID();
  return db.prepare("UPDATE speech_jobs SET state='running',lease=? WHERE id=? AND state='queued'").run(lease,job.id).changes?{...job,lease}:null;
}
export function completeSpeechJob(input:Record<string,unknown>){
  if(typeof input.id!=='string'||typeof input.lease!=='string'||input.error!==undefined&&(typeof input.error!=='string'||input.error.length>2000))throw fail('Invalid speech result.');
  const job=db.prepare("SELECT cache_id,voice FROM speech_jobs WHERE id=? AND lease=? AND state='running' AND deadline>?").get(input.id,input.lease,Date.now()) as {cache_id:string;voice:SpeechVoice}|undefined;
  if(!job)throw fail('The speech request expired or was already completed.',409);
  if(!input.error)cacheAudio(job.cache_id,job.voice,validateSpeechWav(input.audio));
  db.prepare("UPDATE speech_jobs SET state='done',error=? WHERE id=?").run(input.error??null,input.id);
  return {ok:true};
}
const pending=new Map<string,Promise<void>>();
export async function englishAudio(input:Record<string,unknown>){
  const {text,voice}=speechInput(input);
  const cacheId=createHash('sha256').update(JSON.stringify([speechModel,text,voice])).digest('hex');
  const clip=(cached:boolean)=>({url:'/api/english/speech/audio/'+cacheId,voice,cached});
  if(speechAudio(cacheId))return clip(true);
  let task=pending.get(cacheId);
  if(!task){
    if(!speechStatus().ready)throw fail('本机自然语音未连接。请在电脑上运行 Start.bat 并保持在线；已生成的音频仍可播放。 / Local neural speech is offline. Run Start.bat on your computer. Cached clips remain available.',503);
    const count=db.prepare("SELECT count(*) AS n FROM speech_jobs WHERE deadline>? AND state!='done'").get(Date.now()) as {n:number};
    if(count.n>=12)throw fail('语音正在排队，请稍后重试。 / Speech is busy; retry shortly.',429);
    const id=randomUUID(),deadline=Date.now()+120000;
    db.prepare("INSERT INTO speech_jobs(id,cache_id,text,voice,state,deadline) VALUES(?,?,?,?,'queued',?)").run(id,cacheId,text,voice,deadline);
    task=(async()=>{
      try{for(;;){
        const row=db.prepare('SELECT state,error FROM speech_jobs WHERE id=?').get(id) as {state:string;error:string|null}|undefined;
        if(row?.state==='done'){if(row.error)throw fail(row.error,502);return;}
        if(Date.now()>deadline)throw fail('语音生成超时，请重试。 / Speech timed out. Please retry.',504);
        await new Promise(resolve=>setTimeout(resolve,250));
      }}finally{db.prepare('DELETE FROM speech_jobs WHERE id=?').run(id);pending.delete(cacheId);}
    })();
    pending.set(cacheId,task);
  }
  await task;return clip(false);
}
