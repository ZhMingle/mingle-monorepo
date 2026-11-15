// Read the migration origin/key from stdin. Never put secrets or learner data in Git.
import {createInterface} from 'node:readline';
import {DatabaseSync,backup} from 'node:sqlite';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const lines=createInterface({input:process.stdin});
const line=await new Promise<string>(resolve=>lines.once('line',resolve));lines.close();
const config=JSON.parse(line) as {origin:string;key:string};
if(new URL(config.origin).protocol!=='https:'||config.key.length<32)throw new Error('Invalid migration configuration.');
mkdirSync('data/backups',{recursive:true});
const path=`data/backups/cloud-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`;
const source=new DatabaseSync('data/learning.sqlite',{readOnly:true});await backup(source,path);source.close();
const copy=new DatabaseSync(path,{readOnly:true});
if(copy.prepare('PRAGMA integrity_check').get()!.integrity_check!=='ok')throw new Error('Backup integrity check failed.');
const names=(copy.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'cloud_%' ORDER BY name").all() as {name:string}[]).map(r=>r.name);
const tables=Object.fromEntries(names.map(name=>{
  if(!/^[a-z_]+$/.test(name))throw new Error('Unexpected table name.');
  const columns=(copy.prepare(`PRAGMA table_info("${name}")`).all() as {name:string}[]).map(r=>r.name);
  const rows=copy.prepare(`SELECT * FROM "${name}"`).all().map(row=>columns.map(column=>row[column]));
  return [name,{columns,rows}];
}));copy.close();
const digest=createHash('sha256').update(JSON.stringify(tables)).digest('hex');
const response=await fetch(new URL('/api/admin/migrate',config.origin),{method:'POST',headers:{'Content-Type':'application/json','X-Clarity-Migration-Key':config.key},body:JSON.stringify({tables}),signal:AbortSignal.timeout(120000)});
const result=await response.json();if(!response.ok)throw new Error(result.error??'Migration failed.');
if(result.digest!==digest)throw new Error('Migration digest mismatch.');
const counts=Object.fromEntries(Object.entries(tables).map(([name,table])=>[name,table.rows.length]));
if(JSON.stringify(result.counts,Object.keys(result.counts).sort())!==JSON.stringify(counts,Object.keys(counts).sort()))throw new Error('Migration row-count mismatch.');
writeFileSync('data/backups/cloud-migration-receipt.json',JSON.stringify({backup:path,digest,counts,at:new Date().toISOString()},null,2));
console.log(JSON.stringify({backup:path,digest,counts,verified:true}));
