import { assess } from '../server/coach.ts';
import type { LearningSession } from '../shared/types.ts';
const session = { lessonId: 'snapshot', build: { passed: true, tests: [], code: 'setCount(n => n + 1)', runId: 'live-check' } } as unknown as LearningSession;
const answer = 'State is a snapshot of one render. Event handlers capture the values from that render. A setter requests another render rather than changing the current local variable. When count is 0, three calls to setCount(count + 1) all request replacement with 1. Functional updaters instead receive the previous queued result, so three increments produce 3. For restocking four items, I would queue four previous-value increments to avoid reading the same old stock count each time. Not every update needs a function: replacing a text input with an independent new string can use a value directly.';
const assessment = await assess(session, answer, false);
console.log(JSON.stringify({ provider: assessment.provider, scores: assessment.scores, groundedEvidence: assessment.evidence.length, passed: assessment.passed, summary: assessment.summary }, null, 2));
if (!assessment.passed || /\p{Script=Han}/u.test(JSON.stringify(assessment))) process.exitCode = 1;
