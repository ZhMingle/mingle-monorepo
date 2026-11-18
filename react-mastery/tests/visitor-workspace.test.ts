import test from 'node:test';
import assert from 'node:assert/strict';
import {visitorBootstrap,visitorOverview,visitorWorkspace} from '../shared/visitor-workspace.ts';
import {learningPaths} from '../shared/paths.ts';
import {gzipSync} from 'node:zlib';
// @ts-expect-error The Worker is plain ESM, shared by local and hosted checks.
import {createGateway} from '../hosting/gateway.mjs';

const env = {CLARITY_OWNER_EMAIL:'owner@example.com',CLARITY_PROXY_KEY:'p'.repeat(48),CLARITY_BACKEND_ORIGIN:'https://backend.example.com'};
const owner = {'oai-authenticated-user-id':'owner-id','oai-authenticated-user-email':'owner@example.com'};
const assets = {'/index.html':{type:'text/html; charset=utf-8',body:Buffer.from('<div id="root"></div><script src="/assets/original-app.js"></script>').toString('base64')},'/assets/original-app.js':{type:'text/javascript',body:Buffer.from('original App').toString('base64')}};
const gateway = createGateway(assets,visitorWorkspace);
const req = (path:string,headers:Record<string,string>={},post=false) => new Request(`https://site.example.com${path}`,{method:post?'POST':'GET',headers:post?{...headers,Origin:'https://site.example.com','X-Clarity-Request':'1','Content-Type':'application/json'}:headers,body:post?'{}':undefined});

test('visitor bootstrap contains authored lessons and no personal learning records or AI results',()=>{
  const value=visitorBootstrap();
  assert.equal(value.storage,'browser');assert.equal(value.lessons.length,6);
  assert.deepEqual(value.sessions,[]);assert.deepEqual(value.progress,[]);assert.equal(value.connection.available,false);
  assert.ok(value.lessons.every(lesson=>!('prediction' in lesson)));
  const progress=visitorOverview();
  assert.equal(Object.keys(progress.paths).length,learningPaths.length);assert.equal(progress.overall.totalTopics,642);assert.equal(progress.overall.completedChecks,0);
});

test('owner and visitor receive byte-identical original frontend assets and shared route links',async()=>{
  for(const path of ['/',...learningPaths.map(path=>`/#roadmap/${path.id}`),'/assets/original-app.js']){
    const guest=await gateway.fetch(req(path),env),personal=await gateway.fetch(req(path,owner),env);
    assert.equal(guest.status,200);assert.equal(await guest.text(),await personal.text());
    assert.equal(guest.headers.get('cache-control'),'private, no-store');
  }
});

test('packed app assets are decoded before Sites can normalize response headers',async()=>{
  const original='<div id="root">Original Clarity app</div>';
  const packed=createGateway({'/index.html':{type:'text/html; charset=utf-8',encoding:'gzip',body:gzipSync(original).toString('base64')}},visitorWorkspace);
  const response=await packed.fetch(req('/'),env);
  assert.equal(response.headers.has('content-encoding'),false);
  assert.equal(await response.text(),original);
  assert.equal((await packed.fetch(new Request('https://site.example.com/',{method:'HEAD'}),env)).body,null);
});

test('visitors browse the original app data endpoints without reaching personal storage',async()=>{
  const original=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;throw new Error('Must not reach the personal backend');};
  try{
    const identities:Record<string,string>[]=[{},{'oai-authenticated-user-id':'other','oai-authenticated-user-email':'other@example.com'},{'oai-authenticated-user-email':'owner@example.com'}];
    for(const headers of identities){
      assert.deepEqual((await (await gateway.fetch(req('/api/bootstrap',headers),env)).json()).sessions,[]);
      assert.deepEqual(await (await gateway.fetch(req('/api/english',headers),env)).json(),{cards:[]});
      assert.equal((await gateway.fetch(req('/api/study/overview',headers,true),env)).status,200);
      assert.deepEqual(await (await gateway.fetch(req('/api/study/open',headers,true),env)).json(),{session:null,visitor:true});
      for(const path of ['/api/export','/api/session?id=private','/api/study/draft','/api/english/lookup','/api/runtime']) assert.equal((await gateway.fetch(req(path,headers),env)).status,401,path);
    }
    assert.equal(calls,0);
    assert.equal((await gateway.fetch(new Request('https://site.example.com/api/study/overview',{method:'POST'}),env)).status,403);
  }finally{globalThis.fetch=original;}
});

test('verified owner retains private data access and bridge credentials are stripped',async()=>{
  const original=globalThis.fetch;let forwarded:Headers|undefined;
  globalThis.fetch=async(_url,options)=>{forwarded=new Headers(options?.headers);return new Response('{"private":true}',{headers:{'set-cookie':'private=value'}});};
  try{
    const result=await gateway.fetch(req('/api/bootstrap',{...owner,cookie:'private',authorization:'Bearer visitor','x-clarity-bridge-key':'forged'}),env);
    assert.deepEqual(await result.json(),{private:true});assert.equal(forwarded?.get('x-clarity-proxy-key'),env.CLARITY_PROXY_KEY);
    for(const key of ['cookie','authorization','oai-authenticated-user-id','x-clarity-bridge-key'])assert.equal(forwarded?.has(key),false);
    assert.equal(result.headers.has('set-cookie'),false);
    for(const path of ['/api/bridge/claim','/api/admin/migrate','/api/%61dmin/migrate','/healthz'])assert.equal((await gateway.fetch(req(path,owner),env)).status,404);
  }finally{globalThis.fetch=original;}
});

test('sign-in returns to the same application without a separate workspace URL',async()=>{
  assert.equal((await gateway.fetch(req('/?workspace=1'),env)).headers.get('location'),'https://site.example.com/signin-with-chatgpt?return_to=%2F');
  assert.equal((await gateway.fetch(req('/?workspace=1',owner),env)).headers.get('location'),'https://site.example.com/');
});
