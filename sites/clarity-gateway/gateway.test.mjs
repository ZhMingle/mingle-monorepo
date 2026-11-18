import test from 'node:test';
import assert from 'node:assert/strict';
import { createGateway } from './worker/gateway.js';
import { readFile } from 'node:fs/promises';

const env = { CLARITY_BACKEND_ORIGIN: 'https://backend.example.com', CLARITY_PROXY_KEY: 'p'.repeat(48), CLARITY_OWNER_EMAIL: 'owner@example.com' };
const worker = createGateway({ '/index.html': { type: 'text/html; charset=utf-8', body: Buffer.from('<h1>Public library</h1>').toString('base64') }, '/assets/app.js': { type: 'text/javascript; charset=utf-8', body: Buffer.from('public code').toString('base64') } });
const request = (path = '/', headers, method = 'GET') => new Request(`https://site.example.com${path}`, { headers, method });
const owner = { 'oai-authenticated-user-id': 'owner-site-id', 'oai-authenticated-user-email': 'owner@example.com' };

test('anonymous visitors can read the library and assets without backend configuration', async () => {
  assert.match(await (await worker.fetch(request(), {})).text(), /Public library/);
  assert.equal((await worker.fetch(request('/learning-assets/assets/app.js'), {})).status, 200);
  assert.equal((await worker.fetch(request('/learning-assets/not-found.js'), {})).status, 404);
  assert.equal((await worker.fetch(request('/', undefined, 'POST'), {})).status, 405);
  assert.equal((await worker.fetch(request('/', undefined, 'HEAD'), {})).body, null);
});

test('shared route links open the catalog without reaching personal APIs or requiring sign-in', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Curriculum must not call the personal backend'); };
  try {
    const catalog = JSON.parse(await readFile(new URL('./learning/catalog.json', import.meta.url), 'utf8'));
    for (const path of catalog.paths) {
      const result = await worker.fetch(request(`/#roadmap/${path.id}`), {});
      assert.equal(result.status, 200);
      assert.equal(result.headers.get('location'), null);
      assert.match(await result.text(), /Public library/);
    }
  } finally { globalThis.fetch = original; }
});
test('anonymous and other signed-in visitors cannot read or mutate personal records', async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('No upstream call allowed'); };
  try {
    for (const headers of [undefined, { 'oai-authenticated-user-id': 'other', 'oai-authenticated-user-email': 'other@example.com' }, { 'oai-authenticated-user-id': 'other' }, { 'oai-authenticated-user-email': 'owner@example.com' }]) {
      for (const path of ['/api/bootstrap', '/api/study/draft', '/assets/private.js', '/?workspace=1']) {
        const result = await worker.fetch(request(path, headers), env);
        assert.ok([401, 403, 302].includes(result.status), `${path}: ${result.status}`);
      }
    }
    assert.equal(calls, 0);
    assert.equal((await worker.fetch(request('/api/bootstrap', owner), { ...env, CLARITY_OWNER_EMAIL: '' })).status, 403);
  } finally { globalThis.fetch = original; }
});
test('bridge and migration routes remain unavailable even to the owner', async () => {
  for (const path of ['/api/bridge', '/api/bridge/claim', '/api/admin/migrate', '/api/%61dmin/migrate', '/healthz']) assert.equal((await worker.fetch(request(path, owner), env)).status, 404);
});
test('private workspace uses top-level Sites sign-in with a same-origin return path', async () => {
  const result = await worker.fetch(request('/?workspace=1'), env);
  assert.equal(result.status, 302);
  assert.equal(result.headers.get('location'), 'https://site.example.com/signin-with-chatgpt?return_to=%2F%3Fworkspace%3D1');
});
test('owner requests retain private upstream access and strip browser credentials', async () => {
  const original = globalThis.fetch; let forwarded;
  globalThis.fetch = async (url, init) => { forwarded = { url, init }; return new Response('private record', { headers: { 'set-cookie': 'secret=value' } }); };
  try {
    const result = await worker.fetch(new Request('https://site.example.com/api/study/draft', { method: 'POST', body: '{}', headers: { ...owner, cookie: 'session=private', authorization: 'Bearer visitor', 'x-clarity-bridge-key': 'forged', 'x-clarity-request': '1' } }), env);
    assert.equal(await result.text(), 'private record');
    assert.equal(forwarded.url.origin, 'https://backend.example.com');
    assert.equal(forwarded.init.headers.get('x-clarity-proxy-key'), env.CLARITY_PROXY_KEY);
    for (const name of ['cookie', 'authorization', 'oai-authenticated-user-id', 'oai-authenticated-user-email', 'x-clarity-bridge-key']) assert.equal(forwarded.init.headers.has(name), false);
    assert.equal(result.headers.has('set-cookie'), false);
    assert.equal(result.headers.get('cache-control'), 'private, no-store');
    assert.equal((await worker.fetch(request('/', owner), env)).headers.get('content-type'), 'text/html; charset=utf-8');
    await worker.fetch(request('//outside.example/path', owner), env);
    assert.equal(forwarded.url.origin, 'https://backend.example.com');
  } finally { globalThis.fetch = original; }
});
test('public catalog contains authored, bilingual knowledge and six valid React examples', async () => {
  const catalog = JSON.parse(await readFile(new URL('./learning/catalog.json', import.meta.url), 'utf8'));
  assert.equal(catalog.paths.length, 27);
  assert.equal(catalog.paths.flatMap(p => p.stages.flatMap(s => s.topics)).length, 642);
  assert.equal(catalog.lessons.length, 6);
  assert.equal(new Set(catalog.paths.flatMap(p => p.stages.flatMap(s => s.topics.map(t => t.id)))).size, 642);
  for (const path of catalog.paths) for (const stage of path.stages) for (const topic of stage.topics) {
    assert.ok(topic.title.en && topic.title.zh && topic.goal.en && topic.goal.zh && topic.check.en && topic.check.zh);
    assert.match(topic.source, /^https:\/\//);
  }
  for (const lesson of catalog.lessons) assert.ok(lesson.prediction.answer >= 0 && lesson.prediction.answer < lesson.prediction.choices.length);
});
