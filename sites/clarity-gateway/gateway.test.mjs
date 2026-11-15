import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker/index.js';
const env={CLARITY_BACKEND_ORIGIN:'https://backend.example.com',CLARITY_PROXY_KEY:'p'.repeat(48)};
test('gateway rejects missing identity and never proxies internal endpoints',async()=>{
  assert.equal((await worker.fetch(new Request('https://site.example.com/'),env)).status,401);
  for(const path of ['/api/bridge/claim','/api/admin/migrate','/healthz'])assert.equal((await worker.fetch(new Request('https://site.example.com'+path,{headers:{'oai-authenticated-user-id':'owner'}}),env)).status,404);
});
test('gateway strips visitor credentials and injects only its server key',async()=>{
  const previous=globalThis.fetch;let forwarded;
  globalThis.fetch=async(url,init)=>{forwarded={url,init};return new Response('ok',{headers:{'set-cookie':'secret=value'}});};
  try{
    const response=await worker.fetch(new Request('https://site.example.com/api/study/draft',{method:'POST',body:'{}',headers:{'oai-authenticated-user-id':'owner','cookie':'private=secret','authorization':'Bearer visitor','x-clarity-bridge-key':'forged','x-clarity-request':'1','origin':'https://site.example.com'}}),env);
    assert.equal(forwarded.url.origin,'https://backend.example.com');assert.equal(forwarded.init.headers.get('x-clarity-proxy-key'),env.CLARITY_PROXY_KEY);
    for(const name of ['cookie','authorization','oai-authenticated-user-id','x-clarity-bridge-key'])assert.equal(forwarded.init.headers.has(name),false);
    assert.equal(forwarded.init.headers.get('origin'),'https://site.example.com');assert.equal(response.headers.has('set-cookie'),false);assert.equal(response.headers.get('cache-control'),'private, no-store');
  }finally{globalThis.fetch=previous;}
});
