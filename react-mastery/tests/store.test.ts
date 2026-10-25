import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const scratch = mkdtempSync(join(tmpdir(), 'clarity-store-test-'));
process.env.DATA_DIR = scratch;
const store = await import('../server/store.ts');
after(() => { store.db.close(); for (const name of ['learning.sqlite', 'learning.sqlite-wal', 'learning.sqlite-shm']) rmSync(join(scratch, name), { force: true }); rmdirSync(scratch); });
test('sessions, hints and original submitted answers survive storage', () => {
  const session = store.createSession('props', 'practice');
  session.hintsUsed = 1; session.hints.push('Think about the input');
  store.record(session, 'hint', { hint: session.hints[0] });
  store.record(session, 'explanation-submitted', { answer: 'An original learner explanation' });
  assert.equal(store.getSession(session.id).hintsUsed, 1);
  assert.equal(store.exportData().evidence.length, 2);
  assert.equal(store.progressList()[0].status, 'learning');
  assert.throws(() => store.createSession('props', 'review'), /not due/);
});
test('export includes older sessions beyond the journal display limit', () => {
  for (let i = 0; i < 42; i++) store.createSession('snapshot', 'practice');
  assert.equal(store.sessionList().length, 40);
  assert.equal(store.exportData().sessions.length, 43);
});
test('reference views remain recorded after reloading a session and in exports', async () => {
  const { markReferenceViewed } = await import('../server/reference-answers.ts');
  const s = store.createSession('props', 'practice');
  s.explanationText = 'An unfinished answer to preserve';
  markReferenceViewed(s, 'explain');
  store.record(s, 'reference-viewed', { area: 'explain', assisted: true });
  const loaded = store.getSession(s.id);
  assert.deepEqual(loaded.referenceViews, ['explain']);
  assert.equal(loaded.hintsUsed, 1);
  assert.equal(loaded.explanationText, s.explanationText);
  assert.ok(store.exportData().evidence.some(e => {
    const row = e as Record<string, unknown>;
    return row.kind === 'reference-viewed' && row.session_id === s.id;
  }));
});
