import {randomUUID} from 'node:crypto';
import {db} from './store.ts';

db.exec(`CREATE TABLE IF NOT EXISTS cloud_ai_jobs(id TEXT PRIMARY KEY, priority TEXT NOT NULL, state TEXT NOT NULL, created_at INTEGER NOT NULL, deadline INTEGER NOT NULL, lease TEXT, payload TEXT NOT NULL, result TEXT, error TEXT);
CREATE TABLE IF NOT EXISTS cloud_bridge_status(id INTEGER PRIMARY KEY CHECK(id=1), seen_at INTEGER NOT NULL);`);
export function bridgeOnline(){return Number((db.prepare('SELECT seen_at FROM cloud_bridge_status WHERE id=1').get() as {seen_at:number}|undefined)?.seen_at??0)>Date.now()-30000;}
export function bridgeHeartbeat(){db.prepare('INSERT INTO cloud_bridge_status VALUES(1,?) ON CONFLICT(id) DO UPDATE SET seen_at=excluded.seen_at').run(Date.now());}
export function claimAIJob(){
  bridgeHeartbeat();const now=Date.now();
  db.prepare('DELETE FROM cloud_ai_jobs WHERE deadline<?').run(now-300000);
  const job=db.prepare("SELECT id,payload,priority FROM cloud_ai_jobs WHERE state='queued' AND deadline>? ORDER BY CASE priority WHEN 'interactive' THEN 0 WHEN 'translation' THEN 1 ELSE 2 END,created_at LIMIT 1").get(now) as {id:string;payload:string;priority:string}|undefined;
  if(!job)return null;const lease=randomUUID();
  const claimed=db.prepare("UPDATE cloud_ai_jobs SET state='running',lease=? WHERE id=? AND state='queued'").run(lease,job.id);
  return claimed.changes?{id:job.id,lease,priority:job.priority,...JSON.parse(job.payload)}:null;
}
export function completeAIJob(input:Record<string,unknown>){
  if(typeof input.id!=='string'||typeof input.lease!=='string'||input.error!==undefined&&(typeof input.error!=='string'||input.error.length>2000))throw new Error('Invalid bridge result.');
  const result=input.error?null:JSON.stringify(input.result);
  if(!input.error&&(!result||result.length>1000000))throw new Error('Invalid bridge result.');
  const update=db.prepare("UPDATE cloud_ai_jobs SET state='done',result=?,error=? WHERE id=? AND lease=? AND state='running' AND deadline>?").run(result??null,input.error??null,input.id,input.lease,Date.now());
  if(!update.changes)throw new Error('The AI request expired or was already completed.');
  return {ok:true};
}
export async function requestCloudAI<T>(prompt:string,schema:unknown,priority:string):Promise<T>{
  if(!bridgeOnline())throw Object.assign(new Error('Your computer’s Codex connection is offline. Open Start-Cloud-Bridge.bat on your computer; your draft is saved.'),{status:503});
  const id=randomUUID();const deadline=Date.now()+210000;
  db.prepare('INSERT INTO cloud_ai_jobs(id,priority,state,created_at,deadline,payload) VALUES(?,?,?,?,?,?)').run(id,priority,'queued',Date.now(),deadline,JSON.stringify({prompt,schema}));
  try{
    for(;;){
      const row=db.prepare('SELECT state,result,error FROM cloud_ai_jobs WHERE id=?').get(id) as {state:string;result:string|null;error:string|null}|undefined;
      if(row?.state==='done'){if(row.error)throw new Error(row.error);return JSON.parse(row.result!) as T;}
      if(Date.now()>deadline)throw Object.assign(new Error('AI response timed out. Your draft is saved; retry later.'),{status:504});
      await new Promise(resolve=>setTimeout(resolve,500));
    }
  }finally{db.prepare('DELETE FROM cloud_ai_jobs WHERE id=?').run(id);}
}
