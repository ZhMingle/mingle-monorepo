const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const MailroomSync = require('./dist/sync.js');
const source = fs.readFileSync('dist/app.js', 'utf8');
const SESSION_KEY = 'mailroom-gmail-session', LAST_ACCOUNT_KEY = 'mailroom-gmail-last-account';
const EMAIL = 'alice@example.com', NOW = 1800000000000;
const tests = [];
const test = (name, run) => tests.push({ name, run });

function cached(email = EMAIL, id = 'saved-mail', historyId = '10') {
  return JSON.stringify({ version: MailroomSync.CACHE_VERSION, email, historyId, lastSyncedAt: NOW - 60000, limited: false,
    mails: [{ id, from: 'Sender', email: 'sender@example.net', subject: 'Saved subject', snippet: 'Saved summary', cat: 'personal',
      labels: ['INBOX', 'UNREAD'], unread: true, trash: false, date: NOW - 86400000 }] });
}
const cacheKey = email => MailroomSync.CACHE_PREFIX + email;
function connectedStorage(expires = NOW + 3600000) {
  return new Map([[LAST_ACCOUNT_KEY, EMAIL], [cacheKey(EMAIL), cached()],
    [SESSION_KEY, JSON.stringify({ token: 'test-token', expires, email: EMAIL })]]);
}
function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, headers: { get: () => null }, json: async () => data };
}

async function setup({ local = new Map(), legacy = new Map(), responder } = {}) {
  const controls = {}, requests = [], events = [], oauth = { configs: [], requests: [] };
  let now = NOW;
  let currentResponder = responder || (async path => {
    if (path === 'profile') return response({ emailAddress: EMAIL, historyId: '11' });
    if (path.startsWith('history?')) return response({ history: [], historyId: '11' });
    throw Error('Unexpected request: ' + path);
  });
  const element = selector => controls[selector] ??= {
    value: '', hidden: false, disabled: false, textContent: '', innerHTML: '', checked: false,
    classList: { toggle() {} }, dataset: {}, addEventListener() {}, append() {}, focus() {},
    showModal() { this.open = true; }, close() { this.open = false; },
  };
  const storage = (map, kind) => ({
    getItem(key) { events.push({ type: kind + ':get', key }); return map.get(key) ?? null; },
    setItem(key, value) { events.push({ type: kind + ':set', key }); map.set(key, String(value)); },
    removeItem(key) { events.push({ type: kind + ':remove', key }); map.delete(key); },
  });
  class TestDate extends Date { static now() { return now; } }
  const google = { accounts: { oauth2: {
    initTokenClient(config) { oauth.configs.push(config); return { requestAccessToken(options) { oauth.requests.push(options); } }; },
    revoke() {},
  } } };
  const context = vm.createContext({
    URLSearchParams, Date: TestDate, Math, JSON, Number, Promise, Error, Set, Map, MailroomSync,
    document: { querySelector: element, querySelectorAll: () => [], addEventListener() {}, createElement: () => element('created') },
    localStorage: storage(local, 'local'), sessionStorage: storage(legacy, 'session'),
    window: { google }, google, location: { origin: 'https://mailroom.example.test' },
    setTimeout(callback, milliseconds) { setImmediate(() => { now += Math.max(0, milliseconds); callback(); }); },
    fetch: async (url, options) => {
      const path = url.split('/users/me/')[1];
      requests.push({ path, at: now, options });
      events.push({ type: 'fetch', path });
      return currentResponder(path, options);
    },
  });
  const bootstrap = 'reset();restoreConnection();';
  assert(source.includes(bootstrap), 'test must await the actual application bootstrap');
  const runtime = source.replace(bootstrap, 'reset();globalThis.boot=restoreConnection();');
  vm.runInContext(runtime + `\n;globalThis.f={api,refresh,restoreConnection,clearConnection,
    getState:()=>({token,expires,demo,busy,mails,email:syncEngine.email,historyId:syncEngine.historyId,lastSyncedAt:syncEngine.lastSyncedAt})};`, context);
  await context.boot;
  return { context, f: context.f, controls, requests, events, local, legacy, oauth,
    setResponder(next) { currentResponder = next; } };
}

test('reopening restores a persistent session and cache, then performs only a delta', async () => {
  const fixture = await setup({ local: connectedStorage() });
  const state = fixture.f.getState();
  assert.equal(state.token, 'test-token');
  assert.equal(state.demo, false);
  assert.equal(state.busy, false);
  assert.equal(state.email, EMAIL);
  assert.equal(state.mails.length, 1);
  assert.equal(state.mails[0].id, 'saved-mail');
  assert.equal(state.historyId, '11');
  assert.deepEqual(fixture.requests.map(request => request.path.split('?')[0]), ['profile', 'history']);
  const history = fixture.requests.find(request => request.path.startsWith('history?'));
  assert.equal(new URLSearchParams(history.path.split('?')[1]).get('startHistoryId'), '10');
  assert(fixture.controls['#sync-status'].textContent.includes('上次整理'));
  assert.equal(JSON.parse(fixture.local.get(SESSION_KEY)).email, EMAIL);
});

test('an expired token still opens saved mail offline without requesting Gmail', async () => {
  const local = connectedStorage(NOW - 1), saved = local.get(cacheKey(EMAIL));
  const fixture = await setup({ local });
  const state = fixture.f.getState();
  assert.equal(state.token, '');
  assert.equal(state.expires, 0);
  assert.equal(state.demo, false);
  assert.equal(state.mails[0].id, 'saved-mail');
  assert.equal(state.historyId, '10');
  assert.equal(state.lastSyncedAt, NOW - 60000);
  assert.equal(fixture.requests.length, 0);
  assert.equal(local.has(SESSION_KEY), false);
  assert.equal(local.get(cacheKey(EMAIL)), saved);
  assert.equal(fixture.controls['#refresh'].textContent, '重新连接 Gmail');
});

test('legacy tab sessions migrate to persistent sessions without reloading metadata', async () => {
  const local = connectedStorage(), legacy = new Map([[SESSION_KEY, local.get(SESSION_KEY)]]);
  local.delete(SESSION_KEY);
  const fixture = await setup({ local, legacy });
  assert.equal(fixture.f.getState().token, 'test-token');
  assert(local.has(SESSION_KEY));
  assert.equal(legacy.has(SESSION_KEY), false);
  assert.equal(fixture.requests.filter(request => request.path.startsWith('messages/')).length, 0);
});

test('reauthorization verifies profile identity before selecting another account cache', async () => {
  const local = new Map([[LAST_ACCOUNT_KEY, EMAIL], [cacheKey(EMAIL), cached()],
    [cacheKey('bob@example.com'), cached('bob@example.com', 'bob-mail', '20')]]);
  const fixture = await setup({ local, responder: async path => {
    if (path === 'profile') return response({ emailAddress: 'bob@example.com', historyId: '21' });
    if (path.startsWith('history?')) return response({ history: [], historyId: '21' });
    throw Error('Unexpected request: ' + path);
  } });
  assert.equal(fixture.f.getState().mails[0].id, 'saved-mail');
  fixture.events.length = 0;
  fixture.controls['#connect'].onclick();
  fixture.context.document.querySelector('#client-id').value = 'example.apps.googleusercontent.com';
  fixture.controls['#authorize'].onclick();
  assert.equal(fixture.oauth.configs.length, 1);
  assert.equal(fixture.oauth.requests[0].prompt, '', 'returning users need not be forced through consent again');
  await fixture.oauth.configs[0].callback({ access_token: 'bob-token', expires_in: 3600 });
  const verified = fixture.events.findIndex(event => event.type === 'fetch' && event.path === 'profile');
  const selected = fixture.events.findIndex(event => event.type === 'local:get' && event.key === cacheKey('bob@example.com'));
  assert(verified >= 0 && selected > verified, 'Gmail identity is verified before another account cache is loaded');
  assert.equal(fixture.f.getState().email, 'bob@example.com');
  assert.equal(fixture.f.getState().mails.length, 1);
  assert.equal(fixture.f.getState().mails[0].id, 'bob-mail');
  assert.equal(JSON.parse(local.get(SESSION_KEY)).email, 'bob@example.com');
  const history = fixture.requests.find(request => request.path.startsWith('history?'));
  assert.equal(new URLSearchParams(history.path.split('?')[1]).get('startHistoryId'), '20');
  assert.equal(JSON.parse(local.get(cacheKey(EMAIL))).mails[0].id, 'saved-mail');
});

test('Google 401 clears authorization and stops later calls while preserving saved mail', async () => {
  const local = connectedStorage(), saved = local.get(cacheKey(EMAIL));
  const fixture = await setup({ local, responder: async () => response({ error: { message: 'invalid authentication credentials' } }, 401) });
  assert.equal(fixture.requests.length, 1);
  assert.equal(fixture.f.getState().token, '');
  assert.equal(fixture.f.getState().expires, 0);
  assert.equal(local.has(SESSION_KEY), false);
  assert.equal(local.get(cacheKey(EMAIL)), saved);
  assert.equal(fixture.f.getState().mails[0].id, 'saved-mail');
  await assert.rejects(fixture.f.api('messages/a'), /失效|重新授权/);
  assert.equal(fixture.requests.length, 1);
});

test('API reads are paced and rate-limit retried; writes are never replayed', async () => {
  const fixture = await setup({ local: connectedStorage() });
  fixture.requests.length = 0;
  fixture.setResponder(async () => response({ ok: true }));
  await Promise.all(['a', 'b', 'c'].map(id => fixture.f.api('messages/' + id)));
  assert.equal(fixture.requests.length, 3);
  for (let index = 1; index < 3; index++) assert(fixture.requests[index].at - fixture.requests[index - 1].at >= 250);
  let attempts = 0;
  fixture.requests.length = 0;
  fixture.setResponder(async () => ++attempts === 1 ? response({ error: { message: 'per minute quota' } }, 429) : response({ ok: true }));
  assert.equal((await fixture.f.api('messages/rate-limited')).ok, true);
  assert.equal(attempts, 2);
  assert(fixture.requests[1].at - fixture.requests[0].at >= 4000);
  attempts = 0;
  fixture.requests.length = 0;
  fixture.setResponder(async () => { attempts++; return response({ error: { message: 'per minute quota' } }, 429); });
  await assert.rejects(fixture.f.api('messages/batchModify', { ids: ['a'], addLabelIds: ['TRASH'] }), /quota/);
  assert.equal(attempts, 1);
  assert.equal(fixture.requests[0].options.method, 'POST');
  const saved = fixture.local.get(cacheKey(EMAIL));
  fixture.legacy.set(SESSION_KEY, 'legacy-token');
  fixture.f.clearConnection();
  assert.equal(fixture.local.has(SESSION_KEY), false);
  assert.equal(fixture.legacy.has(SESSION_KEY), false);
  assert.equal(fixture.local.get(cacheKey(EMAIL)), saved);
});

(async () => {
  for (const { name, run } of tests) { await run(); console.log('PASS: ' + name); }
  console.log(`PASS: ${tests.length} complete-app session integration regressions`);
})().catch(error => { console.error(error); process.exitCode = 1; });
