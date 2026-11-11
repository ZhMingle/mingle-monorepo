const assert = require('node:assert/strict');
const { MailSync, CACHE_VERSION, CACHE_PREFIX } = require('./dist/sync.js');

// Local Gmail protocol substitute: no real tokens, accounts, or network calls.
const EMAIL = 'alice@example.com';
const cases = [];
const test = (name, run) => cases.push({ name, run });
const clone = value => JSON.parse(JSON.stringify(value));
const classify = subject => /invoice/i.test(subject) ? 'bill' : 'personal';
const profile = (historyId = '10', emailAddress = EMAIL) => ({ emailAddress, historyId });
function message(id, labels = ['INBOX', 'UNREAD'], subject = 'Mail ' + id) {
  return { id, labelIds: labels, internalDate: '1780000000000', snippet: 'Preview ' + id,
    payload: { headers: [{ name: 'From', value: 'Sender <sender@example.net>' }, { name: 'Subject', value: subject }] } };
}
function httpError(status) { const error = new Error('Fixture HTTP ' + status); error.status = status; return error; }
class MemoryStorage {
  constructor() { this.data = new Map(); this.failWrite = false; }
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { if (this.failWrite) throw new Error('Storage quota exceeded'); this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}
function backend(records = []) {
  return {
    records: new Map(records.map(mail => [mail.id, clone(mail)])),
    inbox: records.filter(mail => mail.labelIds.includes('INBOX')).map(mail => mail.id),
    currentProfile: profile(), historyPages: [{ history: [], historyId: '11' }],
    historyError: null, detailErrors: new Map(), calls: [], active: 0, maxActive: 0, onList: null,
    async api(path) {
      this.calls.push(path);
      const [route, query = ''] = path.split('?');
      const params = new URLSearchParams(query);
      if (route === 'profile') return clone(this.currentProfile);
      if (route === 'messages') {
        assert.equal(params.get('labelIds'), 'INBOX', 'full scan must stay in the inbox');
        const max = Number(params.get('maxResults'));
        assert(max > 0 && max <= 500, 'Gmail list page size must be valid');
        const offset = Number(params.get('pageToken') || 0);
        const ids = this.inbox.slice(offset, offset + max);
        const next = offset + max < this.inbox.length ? String(offset + max) : '';
        if (this.onList) await this.onList();
        return { messages: ids.map(id => ({ id })), ...(next ? { nextPageToken: next } : {}) };
      }
      if (route === 'history') {
        assert(params.get('startHistoryId'), 'partial sync requires the saved cursor');
        assert.equal(params.get('labelId'), null, 'history must include inbox label removals');
        if (this.historyError) throw this.historyError;
        const offset = Number(params.get('pageToken') || 0);
        const page = clone(this.historyPages[offset] || { history: [], historyId: '11' });
        if (offset + 1 < this.historyPages.length) page.nextPageToken = String(offset + 1);
        return page;
      }
      if (route.startsWith('messages/')) {
        const id = decodeURIComponent(route.slice('messages/'.length));
        this.active++;
        this.maxActive = Math.max(this.maxActive, this.active);
        try {
          await new Promise(resolve => setImmediate(resolve));
          if (this.detailErrors.has(id)) throw this.detailErrors.get(id);
          if (!this.records.has(id)) throw httpError(404);
          return clone(this.records.get(id));
        } finally { this.active--; }
      }
      throw new Error('Unexpected fixture request: ' + path);
    },
    details() { return this.calls.filter(path => path.startsWith('messages/')).map(path => decodeURIComponent(path.split('?')[0].slice(9))); },
  };
}
function setup(records = [], storage = new MemoryStorage()) {
  const service = backend(records);
  const clock = { value: 1800000000000 };
  const engine = new MailSync({ storage, api: service.api.bind(service), classify, onProgress: () => {}, now: () => clock.value });
  return { engine, service, storage, clock };
}
async function initialized(records = [message('old')], storage) {
  const fixture = setup(records, storage);
  await fixture.engine.sync();
  fixture.service.calls.length = 0;
  fixture.clock.value += 10000;
  return fixture;
}
function state(engine) {
  return clone({ email: engine.email, mails: engine.mails, historyId: engine.historyId,
    lastSyncedAt: engine.lastSyncedAt, limited: engine.limited, hasSnapshot: engine.hasSnapshot });
}
function snapshot(storage, email = EMAIL) { return storage.getItem(CACHE_PREFIX + email.toLowerCase()); }
function typed(field, ids) { return { [field]: ids.map(id => ({ message: { id } })) }; }

test('first sync paginates, caps at 1000, and bounds metadata concurrency', async () => {
  const fixture = setup(Array.from({ length: 1400 }, (_, index) => message(String(index))));
  fixture.service.currentProfile.historyId = '900719925474099312345';
  await fixture.engine.sync();
  assert.equal(fixture.engine.mails.length, 1000);
  assert.equal(new Set(fixture.engine.mails.map(mail => mail.id)).size, 1000);
  assert.equal(fixture.service.details().length, 1000);
  assert(fixture.service.maxActive <= 5, 'at most five metadata requests may overlap');
  assert.equal(fixture.engine.limited, true);
  assert.equal(fixture.engine.historyId, '900719925474099312345', 'history IDs must retain string precision');
  assert.equal(fixture.engine.lastSyncedAt, fixture.clock.value);
  assert.equal(fixture.engine.hasSnapshot, true);
  assert.equal(JSON.parse(snapshot(fixture.storage)).version, CACHE_VERSION);
});

test('reopening restores the saved account and unchanged mail needs no metadata reads', async () => {
  const first = await initialized([message('a'), message('b')]);
  const reopened = setup([], first.storage);
  reopened.engine.selectAccount(EMAIL.toUpperCase());
  assert.equal(reopened.engine.email, EMAIL);
  assert.deepEqual(reopened.engine.mails, first.engine.mails);
  assert.equal(reopened.engine.lastSyncedAt, first.engine.lastSyncedAt);
  assert.equal(reopened.engine.historyId, '10');
  assert.equal(reopened.engine.hasSnapshot, true);
  await reopened.engine.sync({ profile: profile('11') });
  assert.equal(reopened.service.details().length, 0);
  assert.equal(reopened.service.calls.filter(path => path.startsWith('messages?')).length, 0);
  assert.equal(reopened.engine.mails.length, 2);
  assert.equal(reopened.engine.historyId, '11');
  assert.equal(reopened.engine.lastSyncedAt, reopened.clock.value);
});

test('paged deltas merge new mail, label changes, archive, trash and permanent deletion', async () => {
  const { engine, service, storage, clock } = await initialized(['keep', 'archive', 'trash', 'deleted'].map(id => message(id)));
  await engine.saveEdits(engine.mails.map(mail => mail.id === 'keep' ? { ...mail, cat: 'bill', manualCat: 'bill' } : mail.id === 'trash' ? { ...mail, trash: true, labels: ['TRASH'] } : mail));
  service.records.set('keep', message('keep', ['INBOX']));
  service.records.set('archive', message('archive', []));
  service.records.set('trash', message('trash', ['TRASH']));
  service.records.delete('deleted');
  service.records.set('new', message('new', ['INBOX'], 'Invoice for new purchase'));
  service.records.set('sent', message('sent', ['SENT']));
  service.historyPages = [
    { history: [typed('messagesAdded', ['new', 'sent']), typed('labelsRemoved', ['keep', 'archive'])], historyId: '30' },
    { history: [typed('messagesDeleted', ['deleted']), typed('labelsAdded', ['trash']), typed('messagesAdded', ['new'])], historyId: '30' },
  ];
  await engine.sync({ profile: profile('30') });
  assert.deepEqual(engine.mails.map(mail => mail.id).sort(), ['keep', 'new', 'trash']);
  assert.equal(engine.mails.find(mail => mail.id === 'keep').unread, false);
  assert.equal(engine.mails.find(mail => mail.id === 'keep').cat, 'bill', 'manual classification survives incoming label changes');
  assert.equal(engine.mails.find(mail => mail.id === 'keep').manualCat, 'bill');
  assert.equal(engine.mails.find(mail => mail.id === 'new').cat, 'bill');
  assert.equal(engine.mails.find(mail => mail.id === 'trash').trash, true);
  assert.equal(service.calls.filter(path => path.startsWith('history?')).length, 2);
  assert.equal(new Set(service.details()).size, service.details().length, 'duplicate change IDs are fetched once');
  assert(service.details().includes('new'));
  assert(!service.calls.some(path => path.startsWith('messages?')), 'delta does not restart a full inbox scan');
  assert.equal(engine.historyId, '30');
  assert.equal(engine.lastSyncedAt, clock.value);
  assert.deepEqual(JSON.parse(snapshot(storage)).mails, engine.mails);
});

test('failed paged delta leaves the complete prior snapshot and checkpoint intact', async () => {
  const { engine, service, storage } = await initialized();
  const before = state(engine), saved = snapshot(storage);
  service.records.set('old', message('old', ['INBOX'], 'Changed invoice'));
  service.records.set('bad', message('bad'));
  service.historyPages = [
    { history: [typed('labelsAdded', ['old'])], historyId: '20' },
    { history: [typed('messagesAdded', ['bad'])], historyId: '20' },
  ];
  service.detailErrors.set('bad', httpError(503));
  await assert.rejects(engine.sync({ profile: profile('20') }));
  assert.deepEqual(state(engine), before);
  assert.equal(snapshot(storage), saved);
});

test('failed forced full scan preserves previous mail, timestamp and history cursor', async () => {
  const { engine, service, storage } = await initialized();
  const before = state(engine), saved = snapshot(storage);
  service.inbox = ['old', 'bad'];
  service.records.set('old', message('old', ['INBOX'], 'Updated old message'));
  service.records.set('bad', message('bad'));
  service.detailErrors.set('bad', httpError(503));
  await assert.rejects(engine.sync({ force: true, profile: profile('20') }));
  assert.deepEqual(state(engine), before);
  assert.equal(snapshot(storage), saved);
});

test('expired Gmail history falls back with a freshly obtained pre-scan baseline', async () => {
  const { engine, service } = await initialized();
  service.historyError = httpError(404);
  service.currentProfile = profile('40');
  service.inbox = ['replacement'];
  service.records.set('replacement', message('replacement'));
  await engine.sync({ profile: profile('30') });
  assert.equal(service.calls.filter(path => path === 'profile').length, 1, 'fallback refreshes the account checkpoint');
  assert(service.calls.some(path => path.startsWith('messages?')));
  assert.deepEqual(engine.mails.map(mail => mail.id), ['replacement']);
  assert.equal(engine.historyId, '40');
});

test('ordinary history errors do not silently replace a cache with a full scan', async () => {
  const { engine, service, storage } = await initialized();
  const before = state(engine), saved = snapshot(storage);
  service.historyError = httpError(503);
  await assert.rejects(engine.sync({ profile: profile('20') }));
  assert(!service.calls.some(path => path.startsWith('messages?')));
  assert.deepEqual(state(engine), before);
  assert.equal(snapshot(storage), saved);
});

test('malformed, incompatible and wrong-account snapshots are rejected', async () => {
  const first = await initialized();
  const valid = JSON.parse(snapshot(first.storage));
  const invalid = ['{broken', JSON.stringify({ ...valid, version: CACHE_VERSION + 1 }),
    JSON.stringify({ ...valid, email: 'bob@example.com' }), JSON.stringify({ ...valid, mails: {} })];
  for (const value of invalid) {
    const storage = new MemoryStorage();
    storage.setItem(CACHE_PREFIX + EMAIL, value);
    const { engine } = setup([], storage);
    engine.selectAccount(EMAIL);
    assert.equal(engine.hasSnapshot, false);
    assert.equal(engine.mails.length, 0);
    assert(!engine.historyId);
    assert(!engine.lastSyncedAt);
  }
});

test('account snapshots stay separate and forgetting one leaves the other intact', async () => {
  const alice = await initialized();
  const aliceSaved = snapshot(alice.storage);
  const bob = setup([message('bob-only')], alice.storage);
  bob.service.currentProfile = profile('50', 'bob@example.com');
  bob.engine.selectAccount('bob@example.com');
  assert.equal(bob.engine.mails.length, 0);
  assert.equal(bob.engine.hasSnapshot, false);
  await bob.engine.sync();
  assert.deepEqual(bob.engine.mails.map(mail => mail.id), ['bob-only']);
  assert.equal(snapshot(alice.storage), aliceSaved);
  assert(snapshot(alice.storage, 'bob@example.com'));
  await bob.engine.forgetAccount();
  assert.equal(snapshot(alice.storage, 'bob@example.com'), null);
  assert.equal(snapshot(alice.storage), aliceSaved);
});

test('a different authenticated account never merges the previous account cache', async () => {
  const { engine, service, storage } = await initialized([message('alice-only')]);
  const aliceSaved = snapshot(storage);
  service.currentProfile = profile('50', 'bob@example.com');
  service.inbox = ['bob-only'];
  service.records.set('bob-only', message('bob-only'));
  let rejected = false;
  try { await engine.sync({ profile: service.currentProfile }); } catch { rejected = true; }
  if (rejected) {
    assert.equal(engine.email, EMAIL);
    assert.deepEqual(engine.mails.map(mail => mail.id), ['alice-only']);
  } else {
    assert.equal(engine.email, 'bob@example.com');
    assert.deepEqual(engine.mails.map(mail => mail.id), ['bob-only']);
    assert.equal(engine.historyId, '50');
  }
  assert.equal(snapshot(storage), aliceSaved);
});

test('storage quota failure rolls back both sync and manual edits', async () => {
  const { engine, service, storage } = await initialized();
  const before = state(engine), saved = snapshot(storage);
  service.records.set('new', message('new'));
  service.historyPages = [{ history: [typed('messagesAdded', ['new'])], historyId: '20' }];
  storage.failWrite = true;
  await assert.rejects(engine.sync({ profile: profile('20') }));
  assert.deepEqual(state(engine), before);
  assert.equal(snapshot(storage), saved);
  await assert.rejects(async () => engine.saveEdits(engine.mails.map(mail => ({ ...mail, manualCat: 'bill', cat: 'bill' }))));
  assert.deepEqual(state(engine), before);
  assert.equal(snapshot(storage), saved);
  storage.failWrite = false;
  await engine.sync({ profile: profile('20') });
  assert(engine.mails.some(mail => mail.id === 'new'), 'retry from the saved cursor still receives the update');
  assert.equal(engine.historyId, '20');
});

test('manual edits persist without advancing the mailbox checkpoint or sync time', async () => {
  const { engine, storage } = await initialized();
  const historyId = engine.historyId, lastSyncedAt = engine.lastSyncedAt;
  await engine.saveEdits(engine.mails.map(mail => ({ ...mail, manualCat: 'bill', cat: 'bill' })));
  assert.equal(engine.historyId, historyId);
  assert.equal(engine.lastSyncedAt, lastSyncedAt);
  const reopened = setup([], storage).engine;
  reopened.selectAccount(EMAIL);
  assert.equal(reopened.mails[0].manualCat, 'bill');
  assert.equal(reopened.mails[0].cat, 'bill');
  assert.equal(reopened.historyId, historyId);
});

test('new mail arriving during the first scan is retained for the next delta', async () => {
  const { engine, service } = setup([message('before')]);
  service.onList = async () => {
    service.currentProfile = profile('20');
    service.records.set('during', message('during'));
    service.historyPages = [{ history: [typed('messagesAdded', ['during'])], historyId: '20' }];
    service.onList = null;
  };
  await engine.sync();
  assert.equal(engine.historyId, '10', 'the first scan must save its pre-scan checkpoint');
  assert.deepEqual(engine.mails.map(mail => mail.id), ['before']);
  service.calls.length = 0;
  await engine.sync();
  const historyRequest = service.calls.find(path => path.startsWith('history?'));
  assert.equal(new URLSearchParams(historyRequest.split('?')[1]).get('startHistoryId'), '10');
  assert.deepEqual(engine.mails.map(mail => mail.id).sort(), ['before', 'during']);
  assert.equal(engine.historyId, '20');
});

(async () => {
  for (const { name, run } of cases) {
    await run();
    console.log('PASS: ' + name);
  }
  console.log(`PASS: ${cases.length} persistence and incremental-sync regressions`);
})().catch(error => { console.error(error); process.exitCode = 1; });
