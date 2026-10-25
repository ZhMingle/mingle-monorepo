import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translate, chineseMessages } from '../shared/i18n.ts';
import { lessons, challengeFor, roadmap } from '../shared/curriculum.ts';
import { explanationRequirements } from '../shared/explanation-guide.ts';
import { referenceAnswerFor } from '../server/reference-answers.ts';
import { codeHintsFor } from '../server/code-support.ts';

test('authored UI calls have Chinese translations without changing English', () => {
  const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const keys = [...source.matchAll(/\bt\(("(?:[^"\\]|\\.)*")\)/g)].map(m => JSON.parse(m[1]) as string);
  for (const key of keys) {
    assert.ok(Object.hasOwn(chineseMessages, key), `Missing UI translation: ${key}`);
    assert.equal(translate(key, 'en'), key === '&lt; / &gt;' ? '< / >' : key);
  }
});

test('both languages cover all authored lesson, challenge, hint, and reference prose', () => {
  function check(value: unknown, key = '') {
    if (typeof value === 'string' && ['index','Math.random()','item.id'].includes(value)) return;
    if (['id','kind','starter','example','code','source','english','tags','prerequisites','items','phase'].includes(key)) return;
    if (typeof value === 'string' && /[A-Za-z]/.test(value) && !/^\d+$/.test(value)) {
      assert.ok(Object.hasOwn(chineseMessages, value), `Missing content translation: ${value}`);
    } else if (Array.isArray(value)) value.forEach(v => check(v, key));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([k,v]) => check(v,k));
  }
  for (const lesson of lessons) {
    check(lesson); check(referenceAnswerFor(lesson.id));
    check(explanationRequirements(lesson.id)); check(explanationRequirements(lesson.id,true));
    check(codeHintsFor(lesson.id,false)); check(codeHintsFor(lesson.id,true));
    for (const variant of [0,1]) { check(challengeFor(lesson.id,variant)); check(challengeFor(lesson.id,variant,true)); }
  }
  check(roadmap);
});

test('translation leaves unknown learner text and executable code untouched', () => {
  const draft = 'My own answer: props 属于调用方。';
  assert.equal(translate(draft, 'zh'), draft);
  assert.equal(translate(draft, 'en'), draft);
  for (const lesson of lessons) assert.equal(translate(lesson.example, 'zh'), lesson.example);
});
