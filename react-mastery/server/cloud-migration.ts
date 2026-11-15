import {createHash} from 'node:crypto';
import {backup} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {db} from './store.ts';

type Tables=Record<string,{columns:string[];rows:(string|number|null)[][]}>;
db.exec('CREATE TABLE IF NOT EXISTS cloud_migration_receipt(id INTEGER PRIMARY KEY CHECK(id=1), imported_at TEXT NOT NULL, digest TEXT NOT NULL, counts TEXT NOT NULL); CREATE TABLE IF NOT EXISTS cloud_migration_history(id INTEGER PRIMARY KEY, payload TEXT NOT NULL)');
const identifier=(name:string)=>{if(!/^[a-z_]+$/.test(name))throw new Error('Invalid migration table.');return '"'+name+'"';};
const tableNames=()=>(db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'cloud_%' ORDER BY name").all() as {name:string}[]).map(r=>r.name);
const columnsFor=(name:string)=>(db.prepare(`PRAGMA table_info(${identifier(name)})`).all() as {name:string}[]).map(r=>r.name);
const digestOf=(tables:Tables)=>createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.keys(tables).sort().map(name=>[name,tables[name]])))).digest('hex');
function currentSnapshot():Tables{return Object.fromEntries(tableNames().map(name=>{const columns=columnsFor(name);return [name,{columns,rows:db.prepare(`SELECT * FROM ${identifier(name)}`).all().map(row=>columns.map(column=>row[column] as string|number|null))}];}));}
export function migrationStatus(){return db.prepare('SELECT imported_at,digest,counts FROM cloud_migration_receipt WHERE id=1').get()??null;}
function assertUnchanged(){const receipt=migrationStatus();if(!receipt||digestOf(currentSnapshot())!==receipt.digest)throw new Error('Cloud records changed since import; refusing to replace newer learning data.');return receipt;}
export async function repairSnapshot(input:Record<string,unknown>){
  const receipt=assertUnchanged();const dir=resolve(process.env.DATA_DIR??'data','backups');mkdirSync(dir,{recursive:true});const path=resolve(dir,`before-migration-repair-${Date.now()}.sqlite`);await backup(db,path);
  return importSnapshot(input,{receipt,backup:path});
}
export function importSnapshot(input:Record<string,unknown>,repair?:{receipt:Record<string,unknown>;backup:string}){
  if(migrationStatus()&&!repair)throw new Error('Learning data was already imported; refusing to overwrite it.');
  if(repair)assertUnchanged();
  if(!input.tables||typeof input.tables!=='object'||Array.isArray(input.tables))throw new Error('Invalid migration snapshot.');
  const tables=input.tables as Tables;const names=tableNames();
  const ordered=[...names].sort((a,b)=>a==='sessions'?-1:b==='sessions'?1:a==='evidence'?1:b==='evidence'?-1:a.localeCompare(b));
  for(const name of Object.keys(tables))if(!names.includes(name))throw new Error('Unknown snapshot table: '+name);
  for(const name of names){
    if(!repair&&Number(db.prepare(`SELECT COUNT(*) AS n FROM ${identifier(name)}`).get()!.n))throw new Error('Destination contains learning data; refusing to overwrite it.');
    const table=tables[name];if(!table)throw new Error('Snapshot is missing table: '+name);
    if(JSON.stringify(table.columns)!==JSON.stringify(columnsFor(name))||!Array.isArray(table.rows)||table.rows.some(row=>!Array.isArray(row)||row.length!==table.columns.length||row.some(value=>value!==null&&!['string','number'].includes(typeof value))))throw new Error('Incompatible snapshot table: '+name);
  }
  const digest=digestOf(tables);const counts:Record<string,number>={};db.exec('BEGIN IMMEDIATE');
  try{
    if(repair){for(const name of [...ordered].reverse())db.prepare(`DELETE FROM ${identifier(name)}`).run();db.prepare('INSERT INTO cloud_migration_history(payload) VALUES(?)').run(JSON.stringify(repair));}
    for(const name of ordered){const table=tables[name];const insert=db.prepare(`INSERT INTO ${identifier(name)} (${table.columns.map(identifier).join(',')}) VALUES (${table.columns.map(()=>'?').join(',')})`);for(const row of table.rows)insert.run(...row);counts[name]=table.rows.length;}
    if(db.prepare('PRAGMA foreign_key_check').all().length)throw new Error('Snapshot has invalid record references.');
    if(digestOf(currentSnapshot())!==digest)throw new Error('Stored snapshot digest mismatch.');
    db.prepare('INSERT INTO cloud_migration_receipt VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET imported_at=excluded.imported_at,digest=excluded.digest,counts=excluded.counts').run(new Date().toISOString(),digest,JSON.stringify(counts));db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  return {digest,counts};
}
