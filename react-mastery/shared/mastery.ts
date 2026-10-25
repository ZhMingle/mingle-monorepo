import type { Assessment, LearningSession, Progress } from './types.ts';

export const rubricVersion = 'explain-v1';
export function evidenceGates(session: LearningSession) {
  return {
    predict: !!session.prediction?.correct && !!session.prediction.firstTry,
    build: !!session.build?.passed,
    explain: !!session.explanation?.passed,
    transfer: !!session.transfer?.passed && !!session.transferExplanation?.passed,
    independent: session.hintsUsed === 0
  };
}
export function qualifies(session: LearningSession) { return Object.values(evidenceGates(session)).every(Boolean); }
export function nextProgress(session: LearningSession, previous: Progress | undefined, now = new Date()): Progress {
  if (!qualifies(session)) return previous ?? { lessonId: session.lessonId, status: 'learning', completedAt: null, reviewAt: null, reviewCount: 0, sessionId: session.id };
  // Review evidence must be produced after the real due date, never by opening an early practice.
  const delayed = session.mode === 'review' && previous?.reviewAt && new Date(session.createdAt) >= new Date(previous.reviewAt);
  if (previous?.completedAt && !delayed) return previous;
  const count = delayed ? (previous?.reviewCount ?? 0) + 1 : previous?.reviewCount ?? 0;
  const days = [1, 3, 7, 14][Math.min(count, 3)];
  return { lessonId: session.lessonId, status: delayed || count > 0 ? 'retained' : 'provisional', completedAt: now.toISOString(), reviewAt: new Date(now.getTime() + days * 86400000).toISOString(), reviewCount: count, sessionId: session.id };
}
export function validateAssessment(raw: unknown, answer: string): Assessment {
  const a = raw as Assessment;
  if (!a || typeof a !== 'object' || !a.scores || ['correctness', 'causality', 'clarity', 'transfer'].some(k => !Number.isInteger(a.scores[k as keyof Assessment['scores']]) || a.scores[k as keyof Assessment['scores']] < 0 || a.scores[k as keyof Assessment['scores']] > 3)) throw new Error('AI returned an invalid rubric. Please retry; no mastery was awarded.');
  for (const key of ['summary', 'followUp', 'nextStep'] as const) if (typeof a[key] !== 'string') throw new Error('AI response is incomplete. Please retry.');
  if (!Array.isArray(a.evidence) || !Array.isArray(a.misconceptions) || [...a.evidence, ...a.misconceptions].some(v => typeof v !== 'string')) throw new Error('AI response is incomplete.');
  const evidence = a.evidence.filter(q => q.trim().length >= 3 && answer.includes(q.trim()));
  return { ...a, evidence, passed: Object.values(a.scores).every(n => n >= 2) && evidence.length >= 2 && a.misconceptions.length === 0, provider: 'Codex (local sign-in)', rubricVersion, evaluatedAt: new Date().toISOString() };
}
