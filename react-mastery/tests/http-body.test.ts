import test from 'node:test';
import assert from 'node:assert/strict';
import {readJSONBody} from '../server/http-body.ts';
test('request decoding preserves Chinese and emoji across network chunk boundaries',async()=>{
  const value={answer:'我的学习进度🙂',nested:{draft:'保持中文原文'}};const bytes=Buffer.from(JSON.stringify(value));
  async function* stream(){for(let i=0;i<bytes.length;i++)yield bytes.subarray(i,i+1);}
  assert.deepEqual(await readJSONBody(stream()),value);
});
test('request byte limits and malformed JSON fail before accepting a body',async()=>{
  async function* stream(){yield Buffer.from('{"a":"中文"}');}
  await assert.rejects(readJSONBody(stream(),5),/too large/);
  async function* broken(){yield Buffer.from('{');}
  await assert.rejects(readJSONBody(broken()),/Invalid JSON/);
});
