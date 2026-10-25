export type LessonId = 'props' | 'snapshot' | 'immutable' | 'keys' | 'derived' | 'reducer';
export type Stage = 'learn' | 'predict' | 'build' | 'explain' | 'transfer';
export type SessionMode = 'practice' | 'assessment' | 'review';
export type ReferenceArea = 'explain' | 'transfer' | 'build-code' | 'transfer-code';
export interface ReferenceAnswer { paragraphs: string[]; code: string; transfer: string }
export interface Lesson {
  id: LessonId; title: string; english: string; level: string; minutes: number;
  summary: string; why: string; takeaway: string; prerequisites: LessonId[];
  paragraphs: { title: string; body: string }[];
  example: string; source: string; tags: string[]; rubric: string[];
  prediction: { prompt: string; code: string; choices: string[]; answer: number; explanation: string }[];
  hints: string[];
}
export interface Challenge { title: string; brief: string; starter: string; criteria: string[]; kind: LessonId; variant: number }
export interface RunReport { tests: { name: string; passed: boolean; detail: string }[]; error?: string; code: string; passed: boolean; runId: string }
export interface Assessment {
  scores: { correctness: number; causality: number; clarity: number; transfer: number };
  evidence: string[]; misconceptions: string[]; summary: string; followUp: string; nextStep: string;
  passed: boolean; provider: string; rubricVersion: string; evaluatedAt: string;
}
export interface LearningSession {
  id: string; lessonId: LessonId; mode: SessionMode; variant: number; createdAt: string;
  hintsUsed: number; hints: string[]; prediction: { choice: number; correct: boolean; firstTry: boolean } | null;
  build: RunReport | null; explanation: Assessment | null; explanationText: string;
  transfer: RunReport | null; transferExplanation: Assessment | null; transferText: string;
  draft: string; transferDraft: string; stage: Stage;
  referenceViews?: ReferenceArea[];
  hintCounts?: Partial<Record<'build' | 'explain' | 'transfer', number>>;
}
export interface Progress {
  lessonId: LessonId; status: 'learning' | 'provisional' | 'retained' | 'review_due';
  completedAt: string | null; reviewAt: string | null; reviewCount: number; sessionId: string;
}
export interface Bootstrap {
  lessons: Omit<Lesson, 'prediction'>[]; progress: Progress[]; sessions: LearningSession[];
  connection: { available: boolean; provider: string; message: string }; now: string;
}
export interface SessionPayload { session: LearningSession; prediction: Omit<Lesson['prediction'][number], 'answer' | 'explanation'>; challenge: Challenge; transferChallenge: Challenge; progress: Progress[]; referenceAnswers?: Partial<Record<ReferenceArea, ReferenceAnswer>> }
