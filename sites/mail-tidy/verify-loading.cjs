const assert = require('node:assert/strict');
const { MailSync, CACHE_PREFIX } = require('./dist/sync.js');

async function run(total, fail = false) {
  const calls = [], progress = [], store = new Map();
  let active = 0, maxActive = 0, preparingPrevious = fail;
  const storage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: key => store.delete(key),
  };
  const engine = new MailSync({ storage, classify: () => 'personal', now: () => 1800000000000,
    onProgress: text => progress.push(text),
    api: async path => {
      calls.push(path);
      if (path === 'profile') return { emailAddress: 'test@example.com', historyId: preparingPrevious ? '1' : '2' };
      if (path.startsWith('messages?')) {
        const query = new URLSearchParams(path.split('?')[1]);
        assert(Number(query.get('maxResults')) > 0 && Number(query.get('maxResults')) <= 500);
        assert.equal(query.get('labelIds'), 'INBOX');
        const count = preparingPrevious ? 1 : total;
        const start = Number(query.get('pageToken') || 0), end = Math.min(count, start + Number(query.get('maxResults')));
        return { messages: Array.from({ length: end - start }, (_, index) => ({ id: preparingPrevious ? 'previous' : String(start + index) })),
          ...(end < count ? { nextPageToken: String(end) } : {}) };
      }
      assert(path.startsWith('messages/'), 'full loading should request message metadata');
      active++;
      maxActive = Math.max(active, maxActive);
      try {
        await new Promise(resolve => setImmediate(resolve));
        if (fail && !preparingPrevious) throw Error('network failure');
        return { id: path.split('/')[1].split('?')[0], payload: { headers: [] }, labelIds: ['INBOX'], internalDate: '1' };
      } finally { active--; }
    },
  });
  if (fail) {
    await engine.sync();
    preparingPrevious = false;
    calls.length = 0;
    const before = JSON.stringify({ mails: engine.mails, historyId: engine.historyId, lastSyncedAt: engine.lastSyncedAt });
    const saved = store.get(CACHE_PREFIX + 'test@example.com');
    await assert.rejects(engine.sync({ force: true }), /network failure/);
    assert.equal(JSON.stringify({ mails: engine.mails, historyId: engine.historyId, lastSyncedAt: engine.lastSyncedAt }), before);
    assert.equal(store.get(CACHE_PREFIX + 'test@example.com'), saved);
    assert.equal(active, 0, 'all in-flight reads settle before failure is returned');
  } else {
    await engine.sync();
    assert.equal(engine.mails.length, Math.min(total, 1000));
    assert.equal(calls.filter(path => path.startsWith('messages/')).length, Math.min(total, 1000));
    assert.equal(new Set(engine.mails.map(mail => mail.id)).size, engine.mails.length);
    assert.equal(engine.limited, total > 1000);
    assert.equal(engine.hasSnapshot, true);
    if (total > 1000) assert(progress.some(text => text.includes('1000 封')));
  }
  assert(maxActive <= 5);
}

(async () => {
  for (const total of [0, 37, 500, 700, 1000, 1400]) await run(total);
  await run(37, true);
  console.log('PASS: empty/short/multiple pages, 1000 cap, concurrency, durable failure preservation');
})().catch(error => { console.error(error); process.exitCode = 1; });
