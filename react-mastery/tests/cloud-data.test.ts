import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const scratch=mkdtempSync(join(tmpdir(),'clarity-cloud-test-'));process.env.DATA_DIR=scratch;
const {db}=await import('../server/store.ts');
const {importSnapshot,migrationStatus}=await import('../server/cloud-migration.ts');
const {requestCloudAI,claimAIJob,completeAIJob,bridgeHeartbeat}=await import('../server/cloud-ai.ts');
after(()=>{db.close();for(const name of ['learning.sqlite','learning.sqlite-wal','learning.sqlite-shm'])rmSync(join(scratch,name),{force:true});rmdirSync(scratch);});
function snapshot(){return {tables:Object.fromEntries((db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'cloud_%'").all() as {name:string}[]).map(({name})=>[name,{columns:(db.prepare(`PRAGMA table_info(${name})`).all() as {name:string}[]).map(row=>row.name),rows:[] as (string|number|null)[][]}]))};}
test('migration rolls back broken references, copies complete records and refuses a second import',()=>{
  const broken=snapshot();broken.tables.evidence.rows.push(['ev','missing','test','2026-11-16','v1','{}']);
  assert.throws(()=>importSnapshot(broken),/FOREIGN KEY/);assert.equal(migrationStatus(),null);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM evidence').get()!.n,0);
  const good=snapshot();good.tables.sessions.rows.push(['session','props','2026-11-16',JSON.stringify({draft:'Saved learner work',hintsUsed:1})]);good.tables.evidence.rows.push(['ev','session','test','2026-11-16','v1','{"passed":true}']);
  const imported=importSnapshot(good);assert.equal(imported.counts.sessions,1);assert.equal(imported.counts.evidence,1);
  assert.match(String(db.prepare('SELECT payload FROM sessions').get()!.payload),/Saved learner work/);
  assert.throws(()=>importSnapshot(good),/already imported/);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sessions').get()!.n,1);
});
test('AI bridge fails explicitly when offline, validates leases and returns only the completed result',async()=>{
  await assert.rejects(requestCloudAI('question',{},'interactive'),/offline/);
  bridgeHeartbeat();const result=requestCloudAI<{answer:string}>('synthetic question',{type:'object'},'interactive');
  const job=claimAIJob();assert.ok(job);assert.equal(claimAIJob(),null);
  assert.throws(()=>completeAIJob({id:job.id,lease:'wrong',result:{answer:'forged'}}),/expired/);
  completeAIJob({id:job.id,lease:job.lease,result:{answer:'real result'}});
  assert.deepEqual(await result,{answer:'real result'});assert.equal(db.prepare('SELECT COUNT(*) AS n FROM cloud_ai_jobs').get()!.n,0);
});
