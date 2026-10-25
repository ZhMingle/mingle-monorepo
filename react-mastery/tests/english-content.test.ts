import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons, challengeFor, roadmap } from '../shared/curriculum.ts';

test('all authored labs and both exercise variants use English copy', () => {
  const challenges = lessons.flatMap(lesson => [0, 1].flatMap(variant => [
    challengeFor(lesson.id, variant), challengeFor(lesson.id, variant, true)
  ]));
  assert.doesNotMatch(JSON.stringify({ lessons, challenges, roadmap }), /\p{Script=Han}/u);
  assert.equal(challenges.length, 24);
});
