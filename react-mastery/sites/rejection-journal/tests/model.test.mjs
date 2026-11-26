import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRecord,upsertRecord,parseBackup,mergeRecords,visibleRecords,statistics,encodeBackup} from '../web/model.mjs';
const fixture=(changes={})=>({id:'synthetic-1',company:'测试公司 A',position:'前端工程师',stage:'application',date:'2026-11-26',reason:'招聘方未告知具体原因。',createdAt:'2026-11-26T05:00:00.000Z',updatedAt:'2026-11-26T05:00:00.000Z',...changes});
test('required fields, stage, date and reason are validated without inventing a reason',()=>{
  const item=validateRecord(fixture({company:'  测试公司 A  '}));assert.equal(item.company,'测试公司 A');
  for(const patch of [{company:' '},{position:''},{reason:''},{stage:'no-reply'},{date:'2026-02-30'},{date:'invalid'},{id:''}])assert.throws(()=>validateRecord(fixture(patch)));
  assert.equal(validateRecord(fixture({stage:'interview'})).stage,'interview');
});
test('same company and position cannot be counted twice, while editing can change rejection stage',()=>{
  const first=fixture({company:'Example  Company',position:'FRONTEND'}),records=upsertRecord([],first);
  assert.throws(()=>upsertRecord(records,fixture({id:'second',company:'example company',position:'frontend',stage:'interview'})),/已有记录/);
  const updated=upsertRecord(records,{...first,stage:'interview',reason:'招聘方反馈：项目经验不足。'});
  assert.equal(updated.length,1);assert.equal(updated[0].stage,'interview');assert.equal(records[0].stage,'application');
  assert.equal(upsertRecord(records,fixture({id:'other-role',company:first.company,position:'Backend'})).length,2);
});
test('backup round trip preserves records and rejects malformed or duplicate imports',()=>{
  const records=[fixture()];assert.deepEqual(parseBackup(encodeBackup(records)),records);
  for(const text of ['invalid',JSON.stringify({version:2,records}),JSON.stringify({version:1,records:[fixture(),fixture({id:'duplicate'})]}),JSON.stringify({version:1,records:[fixture({reason:''})]})])assert.throws(()=>parseBackup(text));
});
test('import adds new roles without replacing existing notes or repeating positions',()=>{
  const existing=[fixture()],incoming=[fixture({id:'different-id',reason:'另一个原因'}),fixture({id:'new-role',position:'后端工程师'})];
  const merged=mergeRecords(existing,incoming);assert.equal(merged.added,1);assert.equal(merged.skipped,1);assert.equal(merged.records.length,2);assert.equal(merged.records[1].reason,existing[0].reason);
});
test('stage counts, search and ordering use actual records and progress stops at 100 percent',()=>{
  const records=[fixture({date:'2026-11-20'}),fixture({id:'interview',company:'测试公司 B',stage:'interview',reason:'算法题需要练习。'})];
  assert.deepEqual(statistics(records),{total:2,application:1,interview:1,percent:2});
  assert.equal(visibleRecords(records,'interview','算法')[0].id,'interview');assert.equal(visibleRecords(records,'application','算法').length,0);
  assert.equal(visibleRecords(records,'','')[0].id,'interview');assert.equal(statistics(Array(101).fill(fixture())).percent,100);
});
