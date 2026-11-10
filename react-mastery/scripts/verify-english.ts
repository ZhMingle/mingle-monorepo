// Real Codex generation check; isolates all cards from learner data.
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const scratch=mkdtempSync(join(tmpdir(),'clarity-english-live-'));
process.env.DATA_DIR=scratch;
const {lookupEnglish}=await import('../server/english.ts');
const {db}=await import('../server/store.ts');
try{
  const first=await lookupEnglish({query:'I’m down',context:'Want to grab coffee? — I’m down.'});
  assert.equal(first.card.examples.length,2);
  const cached=await lookupEnglish({query:'I’m down',context:'Want to grab coffee? — I’m down.'});
  assert.equal(cached.card.id,first.card.id);assert.equal(cached.cached,true);
  console.log(JSON.stringify(first.card,null,2));
}finally{db.close();rmSync(scratch,{recursive:true,force:true});}
