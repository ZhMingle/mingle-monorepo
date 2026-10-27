import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { lessons, getLesson, challengeFor } from '../shared/curriculum.ts';
import { testNames } from '../shared/test-spec.ts';
import { createSession, exportData, getSession, progressList, record, saveSession, sessionList } from './store.ts';
import { assess, findCodex } from './coach.ts';
import { markReferenceViewed, referenceAnswerFor } from './reference-answers.ts';
import { codeHintsFor, codeReferenceFor } from './code-support.ts';
import { understandingAction, understandingPayload, understandingSessions } from './understanding.ts';
import { topicAction, topicProgress } from './topic-practice.ts';
import { studyAction, studyProgress, studyOverview } from './study.ts';
import type { LearningSession, RunReport, SessionMode, Stage } from '../shared/types.ts';

const port = Number(process.env.PORT ?? 4317);
const production = process.argv.includes('--production');
const origins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]);
const busy = new Set<string>();
const payload = (session: LearningSession) => {
  const { answer: _a, explanation: _e, ...prediction } = getLesson(session.lessonId).prediction[session.variant];
  return { session, prediction, challenge: challengeFor(session.lessonId, session.variant), transferChallenge: challengeFor(session.lessonId, session.variant, true), progress: progressList(), referenceAnswers: Object.fromEntries((session.referenceViews ?? []).map(area => [area, area === 'build-code' || area === 'transfer-code' ? codeReferenceFor(session.lessonId, session.variant, area === 'transfer-code') : referenceAnswerFor(session.lessonId)])) };
};
function send(res: ServerResponse, code: number, body: unknown) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body));
}
async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  let text = ''; for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 100000) throw Object.assign(new Error('Submission is too large'), { status: 413 }); }
  try { return JSON.parse(text); } catch { throw Object.assign(new Error('Invalid JSON body'), { status: 400 }); }
}
function text(value: unknown, max = 20000) { if (typeof value !== 'string' || value.length > max) throw Object.assign(new Error('Invalid text input'), { status: 400 }); return value; }
function stageReady(session: LearningSession, stage: Stage) {
  if (stage === 'build' && !session.prediction) throw new Error('Make a prediction first.');
  if (stage === 'explain' && !session.build?.passed) throw new Error('Pass the code tests before explaining.');
  if (stage === 'transfer' && !session.explanation?.passed) throw new Error('Complete the explanation check first.');
}
const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host ?? '')) { send(res, 403, { error: 'Local access only' }); return; }
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      if (req.method === 'GET') {
        if (url.pathname === '/api/understanding') { send(res, 200, understandingPayload(understandingSessions()[0] ?? null)); return; }
        if (url.pathname === '/api/bootstrap') {
          send(res, 200, { lessons: lessons.map(({ prediction: _, ...lesson }) => lesson), progress: progressList(), sessions: sessionList(), connection: { available: !!findCodex(), provider: 'Codex local sign-in', message: findCodex() ? 'CLI detected · connection verified on first assessment' : 'Codex CLI not found. Sign in locally or set CODEX_BIN.' }, now: new Date().toISOString() }); return;
        }
        if (url.pathname === '/api/session') { send(res, 200, payload(getSession(url.searchParams.get('id') ?? ''))); return; }
        if (url.pathname === '/api/export') { res.setHeader('Content-Disposition', 'attachment; filename="clarity-learning-evidence.json"'); send(res, 200, exportData()); return; }
      }
      if (req.method !== 'POST') { send(res, 404, { error: 'Not found' }); return; }
      if (!origins.has(req.headers.origin ?? '') || req.headers['x-clarity-request'] !== '1' || !req.headers['content-type']?.startsWith('application/json')) { send(res, 403, { error: 'Only requests from the local application are accepted' }); return; }
      const input = await body(req);
      if (url.pathname === '/api/study/overview') { send(res, 200, studyOverview()); return; }
      if (url.pathname === '/api/study/progress') {
        send(res, 200, studyProgress(text(input.pathId, 40))); return;
      }
      if (url.pathname.startsWith('/api/study/')) {
        send(res, 200, await studyAction(url.pathname.slice('/api/study/'.length), input, req.headers['x-clarity-language'] === 'zh' ? 'zh' : 'en')); return;
      }
      if (url.pathname === '/api/topic/progress') {
        send(res, 200, topicProgress(text(input.pathId, 40))); return;
      }
      if (url.pathname.startsWith('/api/topic/')) {
        send(res, 200, await topicAction(url.pathname.slice('/api/topic/'.length), input, req.headers['x-clarity-language'] === 'zh' ? 'zh' : 'en')); return;
      }
      if (url.pathname.startsWith('/api/understanding/')) {
        send(res, 200, await understandingAction(url.pathname.slice('/api/understanding/'.length), input, req.headers['x-clarity-language'] === 'zh' ? 'zh' : 'en')); return;
      }
      if (url.pathname === '/api/session') {
        const mode = input.mode as SessionMode; if (!['practice', 'assessment', 'review'].includes(mode)) throw new Error('Invalid session mode');
        send(res, 200, payload(createSession(text(input.lessonId, 40), mode))); return;
      }
      const session = getSession(text(input.sessionId, 80));
      const lesson = getLesson(session.lessonId);
      switch (url.pathname) {
        case '/api/reference': {
          const area = input.area;
          if (area !== 'explain' && area !== 'transfer' && area !== 'build-code' && area !== 'transfer-code') throw new Error('Unknown reference area');
          stageReady(session, area === 'build-code' ? 'build' : area === 'transfer-code' ? 'transfer' : area);
          if (markReferenceViewed(session, area)) record(session, 'reference-viewed', { area, assisted: true });
          send(res, 200, payload(session)); return;
        }
        case '/api/draft': {
          const stage = input.stage as Stage;
          if (!['learn', 'predict', 'build', 'explain', 'transfer'].includes(stage)) throw new Error('Invalid learning stage');
          stageReady(session, stage); session.stage = stage;
          if (typeof input.draft === 'string') {
            session.draft = text(input.draft);
            if (session.build && session.build.code !== session.draft) { session.build = null; session.explanation = null; session.transfer = null; session.transferExplanation = null; }
          }
          if (typeof input.transferDraft === 'string') {
            session.transferDraft = text(input.transferDraft);
            if (session.transfer && session.transfer.code !== session.transferDraft) { session.transfer = null; session.transferExplanation = null; }
          }
          if (typeof input.explanationText === 'string') {
            const answer = text(input.explanationText, 6000);
            if (answer.trim() !== session.explanationText.trim()) { session.explanation = null; session.transferExplanation = null; }
            session.explanationText = answer;
          }
          if (typeof input.transferText === 'string') {
            const answer = text(input.transferText, 6000);
            if (answer.trim() !== session.transferText.trim()) session.transferExplanation = null;
            session.transferText = answer;
          }
          saveSession(session); send(res, 200, { saved: true }); return;
        }
        case '/api/predict': {
          if (!Number.isInteger(input.choice) || Number(input.choice) < 0 || Number(input.choice) > 2) throw new Error('Choose one prediction');
          const q = lesson.prediction[session.variant];
          const firstTry = session.prediction === null;
          session.prediction = { choice: Number(input.choice), correct: input.choice === q.answer, firstTry: firstTry && input.choice === q.answer };
          record(session, 'prediction', session.prediction);
          send(res, 200, { ...payload(session), feedback: q.explanation }); return;
        }
        case '/api/hint': {
          const area = input.area;
          if (area !== 'build' && area !== 'transfer' && area !== 'explain') throw new Error('Unknown hint area');
          const hints = area === 'explain' ? lesson.hints : codeHintsFor(session.lessonId, area === 'transfer');
          const count = session.hintCounts?.[area] ?? 0;
          const hint = hints[Math.min(count, hints.length - 1)];
          session.hintCounts = { ...session.hintCounts, [area]: count + 1 };
          session.hintsUsed++; session.hints.push(hint);
          record(session, 'hint', { area: input.area, hint }); send(res, 200, { ...payload(session), hint }); return;
        }
        case '/api/run': {
          const transfer = input.transfer === true; stageReady(session, transfer ? 'transfer' : 'build');
          const report = input.report as RunReport;
          const expected = testNames[session.lessonId];
          if (!report || !Array.isArray(report.tests) || report.tests.length !== expected.length || report.tests.some((t, i) => t.name !== expected[i] || typeof t.passed !== 'boolean' || typeof t.detail !== 'string')) throw new Error('Incomplete test report. Run the exercise again.');
          report.code = text(report.code); report.runId = randomUUID(); report.passed = !report.error && report.tests.every(t => t.passed);
          if (transfer) { session.transfer = report; session.transferDraft = report.code; session.transferExplanation = null; } else { session.build = report; session.draft = report.code; session.explanation = null; session.transfer = null; session.transferExplanation = null; }
          record(session, transfer ? 'transfer-code' : 'code', report); send(res, 200, payload(session)); return;
        }
        case '/api/assess': {
          const transfer = input.transfer === true; stageReady(session, transfer ? 'transfer' : 'explain');
          if (transfer && !session.transfer?.passed) throw new Error('Pass the transfer code tests first.');
          const answer = text(input.answer, 6000).trim(); if (answer.length < 40) throw new Error('Write a few sentences explaining why it works, how to implement it, and a new example.');
          if (busy.has(session.id)) throw Object.assign(new Error('This session is already being assessed'), { status: 409 });
          if (transfer) session.transferText = answer; else session.explanationText = answer;
          record(session, transfer ? 'transfer-explanation-submitted' : 'explanation-submitted', { answer, codeRunId: transfer ? session.transfer?.runId : session.build?.runId }); busy.add(session.id);
          try {
            const assessment = await assess(session, answer, transfer, req.headers['x-clarity-language'] === 'zh' ? 'zh' : 'en');
            // Re-read so a concurrently saved draft/hint can never be lost.
            const latest = getSession(session.id);
            if ((transfer ? latest.transfer?.runId : latest.build?.runId) !== (transfer ? session.transfer?.runId : session.build?.runId)) throw Object.assign(new Error('The code has changed. Resubmit your explanation using the latest code that passed the checks.'), { status: 409 });
            if ((transfer ? latest.transferText : latest.explanationText).trim() !== answer) throw Object.assign(new Error('Your explanation has changed. Submit the latest version for a matching assessment.'), { status: 409 });
            if (transfer) { latest.transferText = answer; latest.transferExplanation = assessment; } else { latest.explanationText = answer; latest.explanation = assessment; }
            record(latest, transfer ? 'transfer-explanation' : 'explanation', assessment); send(res, 200, payload(latest));
          } finally { busy.delete(session.id); }
          return;
        }
        default: send(res, 404, { error: 'Not found' }); return;
      }
    }
    if (vite) { vite.middlewares(req, res, () => { res.statusCode = 404; res.end('Not found'); }); return; }
    const root = resolve('dist');
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    let file = resolve(root, relative || 'index.html');
    if (file !== root && !file.startsWith(root + sep)) { send(res, 403, { error: 'Invalid path' }); return; }
    try { if (!(await stat(file)).isFile()) file = resolve(root, 'index.html'); } catch { file = resolve(root, 'index.html'); }
    const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
    // Pick up the latest hashed editor bundle after a build.
    res.setHeader('Cache-Control', extname(file) === '.html' ? 'no-store' : 'no-cache');
    res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream'); res.end(await readFile(file));
  } catch (error) {
    const e = error as Error & { status?: number }; send(res, e.status ?? 400, { error: e.message });
  }
});
const vite = production ? null : await createViteServer({ server: { middlewareMode: true, hmr: { server } }, appType: 'spa' });
server.listen(port, '127.0.0.1', () => console.log(`Clarity is ready at http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { server.close(); void vite?.close(); process.exit(0); });
