import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const scratch=mkdtempSync(join(tmpdir(),'clarity-source-repair-'));process.env.DATA_DIR=scratch;
const {db}=await import('../server/store.ts');
after(()=>{db.close();rmSync(scratch,{recursive:true,force:true});});
test('startup repairs the saved example with an original-payload backup and no learner-progress changes',async()=>{
  db.exec('CREATE TABLE english_cards(id TEXT PRIMARY KEY,lookup_key TEXT UNIQUE NOT NULL,created_at TEXT NOT NULL,payload TEXT NOT NULL); CREATE TABLE english_card_numbers(number INTEGER PRIMARY KEY AUTOINCREMENT,card_id TEXT UNIQUE NOT NULL)');
  const card={id:'legacy-example',number:65,term:'desensitized',query:'desensitized he need to be desensitized',createdAt:'2026-11-17',favorite:true,examples:[{english:'desensitized he need to be desensitized',chinese:'重复词头'},{english:'A retained example.',chinese:'保留例句。'}]};
  db.prepare('INSERT INTO english_cards VALUES(?,?,?,?)').run(card.id,'legacy',card.createdAt,JSON.stringify(card));db.prepare('INSERT INTO english_card_numbers VALUES(65,?)').run(card.id);
  db.prepare('INSERT INTO progress VALUES(?,?)').run('retained-progress','{"started":true}');
  const {englishCards}=await import('../server/english.ts');const fixed=englishCards()[0];assert.equal(fixed.id,card.id);assert.equal(fixed.number,65);assert.equal(fixed.favorite,true);assert.equal(fixed.query,card.query);assert.equal(fixed.examples[0].english,'He needs to be desensitized.');assert.deepEqual(fixed.examples[1],card.examples[1]);
  const backup=db.prepare('SELECT original_payload FROM english_card_repairs WHERE card_id=?').get(card.id) as {original_payload:string};assert.deepEqual(JSON.parse(backup.original_payload),card);
  assert.equal((db.prepare('SELECT payload FROM progress').get() as {payload:string}).payload,'{"started":true}');
});
