import {createHash} from 'node:crypto';
import {db} from './store.ts';

const internal=new Set(['cloud_ai_jobs','cloud_bridge_status','cloud_migration_receipt']);
db.exec('CREATE TABLE IF NOT EXISTS cloud_migration_receipt(id INTEGER PRIMARY KEY CHECK(id=1), imported_at TEXT NOT NULL, digest TEXT NOT NULL, counts TEXT NOT NULL)');
const identifier=(name:string)=>{if(!/^[a-z_]+$/.test(name))throw new Error('Invalid migration table.');return '"'+name+'"';};
export function migrationStatus(){return db.prepare('SELECT imported_at,digest,counts FROM cloud_migration_receipt WHERE id=1').get()??null;}
export function importSnapshot(input:Record<string,unknown>){
  if(migrationStatus())throw new Error('Learning data was already imported; refusing to overwrite it.');
  if(!input.tables||typeof input.tables!=='object'||Array.isArray(input.tables))throw new Error('Invalid migration snapshot.');
  const tables=input.tables as Record<string,{columns:string[];rows:unknown[][]}>;
  const names=(db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as {name:string}[]).map(r=>r.name).filter(name=>!internal.has(name));
  const ordered=names.sort((a,b)=>a==='sessions'?-1:b==='sessions'?1:a==='evidence'?1:b==='evidence'?-1:a.localeCompare(b));
  for(const name of Object.keys(tables))if(!names.includes(name))throw new Error('Unknown snapshot table: '+name);
  for(const name of names){
    if(Number(db.prepare(`SELECT COUNT(*) AS n FROM ${identifier(name)}`).get()!.n))throw new Error('Destination contains learning data; refusing to overwrite it.');
    const table=tables[name];if(!table)throw new Error('Snapshot is missing table: '+name);
    const columns=(db.prepare(`PRAGMA table_info(${identifier(name)})`).all() as {name:string}[]).map(r=>r.name);
    if(JSON.stringify(table.columns)!==JSON.stringify(columns)||!Array.isArray(table.rows)||table.rows.some(row=>!Array.isArray(row)||row.length!==columns.length||row.some(value=>value!==null&&!['string','number'].includes(typeof value))))throw new Error('Incompatible snapshot table: '+name);
  }
  const digest=createHash('sha256').update(JSON.stringify(tables)).digest('hex');const counts:Record<string,number>={};
  db.exec('BEGIN IMMEDIATE');
  try{
    for(const name of ordered){const table=tables[name];const insert=db.prepare(`INSERT INTO ${identifier(name)} (${table.columns.map(identifier).join(',')}) VALUES (${table.columns.map(()=>'?').join(',')})`);for(const row of table.rows)insert.run(...row as (string|number|null)[]);counts[name]=table.rows.length;}
    if(db.prepare('PRAGMA foreign_key_check').all().length)throw new Error('Snapshot has invalid record references.');
    db.prepare('INSERT INTO cloud_migration_receipt VALUES(1,?,?,?)').run(new Date().toISOString(),digest,JSON.stringify(counts));db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  return {digest,counts};
}
