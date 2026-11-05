import test from 'node:test';
import assert from 'node:assert/strict';
import {codeChanges,characterChanges} from '../shared/code-diff.ts';

test('one changed line retains syntax and accurate old/new positions, omitting unchanged code',()=>{
  const before='import React from "react";\n\nfunction record() {\n  pending.current += 1;\n}\n\nexport default record;';
  const after=before.replace('+= 1','+= step');
  assert.deepEqual(codeChanges(before,after),[[
    {kind:'context',text:'function record() {',oldLine:3,newLine:3},
    {kind:'remove',text:'  pending.current += 1;',oldLine:4},
    {kind:'add',text:'  pending.current += step;',newLine:4},
    {kind:'context',text:'}',oldLine:5,newLine:5}
  ]]);
});

test('separate changes create separate hunks, preserving insertions and deletions',()=>{
  const before='a\nb\nc\nd\ne\nf\ng\nh\ni';
  const after='a\nadded\nb\nc\nd\ne\nf\ng\ni';
  const hunks=codeChanges(before,after);
  assert.equal(hunks.length,2);
  assert.ok(hunks[0].some(line=>line.kind==='add'&&line.text==='added'&&line.newLine===2));
  assert.ok(hunks[1].some(line=>line.kind==='remove'&&line.text==='h'&&line.oldLine===8));
});

test('unchanged submissions and saved Markdown wrappers do not produce false changes',()=>{
  assert.deepEqual(codeChanges('const x = 1;\r\n','const x = 1;\n'),[]);
  assert.deepEqual(codeChanges('```jsx\nconst x = 1;\n```','const x = 1;'),[]);
  assert.deepEqual(codeChanges('',''),[]);
});

test('bounded fallback retains every changed line for large replacements',()=>{
  const before=Array.from({length:1100},(_,i)=>`old ${i}`).join('\n');
  const after=Array.from({length:1100},(_,i)=>`new ${i}`).join('\n');
  const lines=codeChanges(before,after).flat();
  assert.equal(lines.filter(line=>line.kind==='remove').map(line=>line.text).join('\n'),before);
  assert.equal(lines.filter(line=>line.kind==='add').map(line=>line.text).join('\n'),after);
});

test('character changes isolate SQL letters and multiple separated edits',()=>{
  const before='WHERE email = NULL ORDER BY id DESC;';
  const after='WHERE email IS NULL ORDER BY id ASC;';
  const diff=characterChanges(before,after);
  assert.equal(diff.before.map(r=>before.slice(r.from,r.to)).join(''),'=DE');
  assert.equal(diff.after.map(r=>after.slice(r.from,r.to)).join(''),'ISA');
  assert.deepEqual(characterChanges('same','same'),{before:[],after:[]});
  assert.deepEqual(characterChanges('','UNIQUE'),{before:[],after:[{from:0,to:6}]});
  assert.deepEqual(characterChanges('x',''),{before:[{from:0,to:1}],after:[]});
});