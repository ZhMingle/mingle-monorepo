import { test } from 'node:test';
import assert from 'node:assert/strict';
import { qualifies, nextProgress, validateAssessment } from '../shared/mastery.ts';
import type { LearningSession } from '../shared/types.ts';
import { challengeFor, lessons } from '../shared/curriculum.ts';
import { explanationRequirements } from '../shared/explanation-guide.ts';
import { markReferenceViewed, referenceAnswerFor } from '../server/reference-answers.ts';

const raw = { scores: { correctness: 2, causality: 2, clarity: 3, transfer: 2 }, evidence: ['旧值不是原地改变', '下一次渲染'], misconceptions: [], summary: '正确', followUp: '换一个场景？', nextStep: '尝试迁移' };
const assessment = validateAssessment(raw, '旧值不是原地改变，setState 请求下一次渲染。');
function passed(): LearningSession {
  const report = { tests: [{ name: 'check', passed: true, detail: '' }], code: '', passed: true, runId: 'run' };
  return { id: 'session', lessonId: 'snapshot', mode: 'assessment', variant: 0, createdAt: '2026-10-25T00:00:00Z', hintsUsed: 0, hints: [], prediction: { choice: 1, correct: true, firstTry: true }, build: report, explanation: assessment, explanationText: '', transfer: report, transferExplanation: assessment, transferText: '', draft: '', transferDraft: '', stage: 'transfer' };
}
test('mastery requires all independent evidence in the same session', () => {
  const s = passed(); assert.equal(qualifies(s), true);
  s.hintsUsed = 1; assert.equal(qualifies(s), false);
  s.hintsUsed = 0; s.prediction!.firstTry = false; assert.equal(qualifies(s), false);
  s.prediction!.firstTry = true; s.transferExplanation = null; assert.equal(qualifies(s), false);
});
test('one session only proves preliminary mastery, not retention', () => {
  const p = nextProgress(passed(), undefined, new Date('2026-10-25T00:00:00Z'));
  assert.equal(p.status, 'provisional'); assert.equal(p.reviewAt, '2026-10-26T00:00:00.000Z');
});
test('viewing a reference records assistance without changing drafts or granting mastery', () => {
  const s = passed(); s.explanationText = 'My own explanation'; s.draft = 'My own code';
  assert.equal(markReferenceViewed(s, 'explain'), true);
  assert.equal(s.hintsUsed, 1);
  assert.equal(markReferenceViewed(s, 'explain'), false);
  assert.equal(s.hintsUsed, 1);
  assert.equal(s.explanationText, 'My own explanation');
  assert.equal(s.draft, 'My own code');
  assert.equal(qualifies(s), false);
  s.hintsUsed = 0;
  assert.equal(qualifies(s), false);
  assert.equal(nextProgress(s, undefined).status, 'learning');
  assert.equal(qualifies(passed()), true);
  for (const lesson of lessons) {
    const reference = referenceAnswerFor(lesson.id);
    assert.ok(reference.paragraphs.length >= 3);
    assert.ok(reference.code.length > 20 && reference.transfer.length > 30);
    assert.equal(explanationRequirements(lesson.id).length, 4);
    assert.match(explanationRequirements(lesson.id, true).join(' '), /follow-up/);
    assert.doesNotMatch(JSON.stringify({ reference, requirements: explanationRequirements(lesson.id) }), /\p{Script=Han}/u);
  }
});
test('early practice cannot produce retention or postpone a real review', () => {
  const s = passed(); const p = nextProgress(s, undefined, new Date('2026-10-25T00:00:00Z'));
  s.mode = 'review'; s.createdAt = '2026-10-25T12:00:00Z';
  assert.deepEqual(nextProgress(s, p, new Date('2026-10-25T12:00:00Z')), p);
  s.createdAt = '2026-10-26T01:00:00Z';
  const reviewed = nextProgress(s, p, new Date('2026-10-26T01:00:00Z'));
  assert.equal(reviewed.status, 'retained'); assert.equal(reviewed.reviewCount, 1); assert.equal(reviewed.reviewAt, '2026-10-29T01:00:00.000Z');
});
test('AI must cite actual learner evidence; scores alone never pass', () => {
  assert.equal(assessment.passed, true);
  assert.equal(validateAssessment({ ...raw, evidence: ['这个引用不在学习者原文里', '另一个虚构引用'] }, '原文完全不同').passed, false);
  assert.equal(validateAssessment({ ...raw, misconceptions: ['把 setter 当成同步赋值'] }, '旧值不是原地改变，下一次渲染').passed, false);
  assert.throws(() => validateAssessment({ ...raw, scores: { ...raw.scores, clarity: 9 } }, ''), /invalid rubric/);
});
test('every playable lesson has grounded content, a variant and a transfer task', () => {
  assert.equal(lessons.length, 6);
  for (const lesson of lessons) {
    assert.match(lesson.source, /^https:\/\/react.dev\//);
    assert.equal(lesson.prediction.length, 2);
    assert.notEqual(challengeFor(lesson.id, 0).variant, challengeFor(lesson.id, 0, true).variant);
    assert.ok(challengeFor(lesson.id, 1).starter.includes('function Exercise'));
  }
});
