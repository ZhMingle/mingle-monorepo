import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { LearningSession, Progress, SessionMode, Stage } from '../shared/types.ts';
import { getLesson, curriculumVersion } from '../shared/curriculum.ts';
import { nextProgress } from '../shared/mastery.ts';

const dataDir = resolve(process.env.DATA_DIR ?? 'data');
mkdirSync(dataDir, { recursive: true });
export const db = new DatabaseSync(resolve(dataDir, 'learning.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL, created_at TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, kind TEXT NOT NULL, created_at TEXT NOT NULL, curriculum_version TEXT NOT NULL, payload TEXT NOT NULL, FOREIGN KEY(session_id) REFERENCES sessions(id));
CREATE TABLE IF NOT EXISTS progress (lesson_id TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS understanding_sessions (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, payload TEXT NOT NULL);
PRAGMA user_version=2;`);

export function progressList(): Progress[] {
  return (db.prepare('SELECT payload FROM progress').all() as { payload: string }[]).map(row => {
    const p = JSON.parse(row.payload) as Progress;
    return { ...p, status: p.reviewAt && new Date(p.reviewAt) <= new Date() ? 'review_due' : p.status };
  });
}
export function sessionList(all = false): LearningSession[] { return (db.prepare(`SELECT payload FROM sessions ORDER BY created_at DESC${all ? '' : ' LIMIT 40'}`).all() as { payload: string }[]).map(r => JSON.parse(r.payload)); }
export function getSession(id: string): LearningSession {
  const row = db.prepare('SELECT payload FROM sessions WHERE id=?').get(id) as { payload: string } | undefined;
  if (!row) throw Object.assign(new Error('Session not found'), { status: 404 });
  return JSON.parse(row.payload);
}
export function saveSession(session: LearningSession) {
  db.prepare('INSERT INTO sessions(id,lesson_id,created_at,payload) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(session.id, session.lessonId, session.createdAt, JSON.stringify(session));
}
export function createSession(lessonId: string, mode: SessionMode): LearningSession {
  const lesson = getLesson(lessonId);
  const p = progressList().find(p => p.lessonId === lessonId);
  if (mode === 'review' && (!p?.reviewAt || new Date(p.reviewAt) > new Date())) throw Object.assign(new Error('Delayed review is not due yet. Practice is available now.'), { status: 409 });
  const row = db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE lesson_id=?').get(lessonId) as { n: number };
  const session: LearningSession = { id: randomUUID(), lessonId: lesson.id, mode, variant: row.n % 2, createdAt: new Date().toISOString(), hintsUsed: 0, hints: [], prediction: null, build: null, explanation: null, explanationText: '', transfer: null, transferExplanation: null, transferText: '', draft: '', transferDraft: '', stage: 'learn' };
  saveSession(session); return session;
}
export function record(session: LearningSession, kind: string, payload: unknown) {
  db.exec('BEGIN');
  try {
    saveSession(session);
    db.prepare('INSERT INTO evidence VALUES(?,?,?,?,?,?)').run(randomUUID(), session.id, kind, new Date().toISOString(), curriculumVersion, JSON.stringify(payload));
    const prior = progressList().find(p => p.lessonId === session.lessonId);
    // Finishing the same session twice must not postpone its review deadline.
    const p = prior?.sessionId === session.id && prior.completedAt ? prior : nextProgress(session, prior);
    db.prepare('INSERT INTO progress VALUES(?,?) ON CONFLICT(lesson_id) DO UPDATE SET payload=excluded.payload').run(p.lessonId, JSON.stringify(p));
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function moveStage(session: LearningSession, stage: Stage) { session.stage = stage; saveSession(session); }
export function exportData() {
  return { schemaVersion: 2, curriculumVersion, exportedAt: new Date().toISOString(), progress: progressList(), sessions: sessionList(true), understandingSessions: (db.prepare('SELECT payload FROM understanding_sessions ORDER BY created_at').all() as {payload:string}[]).map(row => JSON.parse(row.payload)), evidence: (db.prepare('SELECT * FROM evidence ORDER BY created_at').all() as Record<string, unknown>[]).map(row => ({ ...row, payload: JSON.parse(String(row.payload)) })) };
}
