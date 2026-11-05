import test from 'node:test';
import assert from 'node:assert/strict';
import {exerciseBrief} from '../shared/exercise-brief.ts';

test('long saved descriptions show the task first while retaining expansion for constraints',()=>{
  assert.deepEqual(exerciseBrief('修复订阅表单。\n假设支持原生校验。保留 GET 提交。'),{lead:'修复订阅表单。',expanded:true});
  assert.deepEqual(exerciseBrief('Repair the form. Keep GET submission.'),{lead:'Repair the form.',expanded:true});
  assert.deepEqual(exerciseBrief('修复表单。'),{lead:'修复表单。',expanded:false});
});
test('punctuation in inline code and fenced source is not split',()=>{
  assert.deepEqual(exerciseBrief('修复 `a.b` 的返回值。保留签名。'),{lead:'修复 `a.b` 的返回值。',expanded:true});
  const source='修复代码：\n```js\na.b();\n```';
  assert.deepEqual(exerciseBrief(source),{lead:source,expanded:false});
});
