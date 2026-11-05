import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceComparison} from '../src/reference-comparison.ts';
import {codeChanges} from '../shared/code-diff.ts';

test('query-only SQL reference preserves setup and exposes the two task repairs',async()=>{
  const starter=`CREATE TABLE customers (id integer PRIMARY KEY);
CREATE TABLE orders (id integer PRIMARY KEY, customer_id integer, status text);
-- 修改下面的查询。
SELECT c.id, COUNT(*) AS paid_count
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.status = 'paid'
GROUP BY c.id ORDER BY c.id;`;
  const reference=`SELECT c.id, COUNT(o.id) AS paid_count FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id AND o.status = 'paid'
GROUP BY c.id ORDER BY c.id;`;
  const result=await referenceComparison(starter,reference,'sql','postgresql');
  assert.equal(result.preservedSetup,true);
  const changes=codeChanges(result.before,result.after).flat().filter(l=>l.kind!=='context');
  assert.ok(!changes.some(l=>/CREATE|修改下面/.test(l.text)));
  assert.ok(changes.some(l=>l.kind==='remove'&&l.text.includes('COUNT(*)')));
  assert.ok(changes.some(l=>l.kind==='add'&&l.text.includes('COUNT(o.id)')));
  assert.ok(changes.some(l=>l.kind==='remove'&&l.text.includes('WHERE')));
  assert.ok(changes.some(l=>l.kind==='add'&&l.text.includes('AND')));
});

test('equivalent SQL formatting does not create repair steps',async()=>{
  const result=await referenceComparison('SELECT id FROM users WHERE id = 1;', 'select id\nfrom users\nwhere id = 1;', 'sql','postgresql');
  assert.deepEqual(codeChanges(result.before,result.after),[]);
});

test('explicit schema changes remain visible and invalid starter keeps original text',async()=>{
  const result=await referenceComparison('CREATE TABLE users (email text);','CREATE TABLE users (email text UNIQUE);','sql','postgresql');
  assert.equal(result.preservedSetup,false);
  assert.ok(codeChanges(result.before,result.after).flat().some(l=>l.kind==='add'&&l.text.includes('UNIQUE')));
  const invalid=await referenceComparison('const x = ;','const x = 1;','javascript','nodejs');
  assert.equal(invalid.before,'const x = ;');
  assert.equal(invalid.after,'const x = 1;');
});
