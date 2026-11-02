import test from 'node:test';
import assert from 'node:assert/strict';
import { textBlocks,inlineParts } from '../shared/rich-text.ts';
import { choiceReference } from '../shared/study.ts';

test('SQL explanation separates code, headings, lists and highlighted concepts without altering SQL',()=>{
  const sql='SELECT id FROM contacts WHERE email IS NULL ORDER BY id;';
  const blocks=textBlocks('### Key rule\r\n**Missing values** require `IS NULL`.\r\n\r\n```sql\r\n'+sql+'\r\n```\r\n- = NULL is unknown\r\n- IS NOT NULL finds present values\r\n\r\n1. Check missing data\r\n2. Compare results');
  assert.deepEqual(blocks,[{kind:'heading',text:'Key rule'},{kind:'paragraph',text:'**Missing values** require `IS NULL`.'},{kind:'code',text:sql,language:'sql'},{kind:'list',items:['= NULL is unknown','IS NOT NULL finds present values'],ordered:false},{kind:'list',items:['Check missing data','Compare results'],ordered:true}]);
  assert.deepEqual(inlineParts('**Use `IS NULL`** and `= NULL`'),[{kind:'strong',text:'Use `IS NULL`'},{kind:'text',text:' and '},{kind:'code',text:'= NULL'}]);
});

test('HTML remains plain text and incomplete fences preserve the submitted code',()=>{
  assert.deepEqual(textBlocks('<script>alert(1)</script>'),[{kind:'paragraph',text:'<script>alert(1)</script>'}]);
  assert.deepEqual(textBlocks('```sql\nSELECT "<img>";'),[{kind:'code',language:'sql',text:'SELECT "<img>";'}]);
});

test('reference does not prepend a SQL option already repeated in its explanation',()=>{
  const code='```sql\nSELECT id FROM contacts WHERE email IS NULL;\n```';
  const choice={scenario:'',code:'',question:'',options:[code,'Other','Third'],correct:0,explanation:'The correct option is:\n'+code+'\nUse `IS NULL`.'};
  assert.equal(choiceReference(choice),choice.explanation);
  assert.equal(choiceReference({...choice,explanation:'Missing values require IS NULL.'}),code+'\n\nMissing values require IS NULL.');
});
