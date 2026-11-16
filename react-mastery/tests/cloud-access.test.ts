import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudAuthorized,cloudSettings} from '../server/cloud-access.ts';
const env={CLARITY_CLOUD:'1',PUBLIC_ORIGIN:'https://clarity.example.com',CLARITY_PROXY_KEY:'p'.repeat(48),CLARITY_BRIDGE_KEY:'b'.repeat(48),CLARITY_MIGRATION_KEY:'m'.repeat(48)};
test('cloud startup fails closed and local startup stays on loopback',()=>{
  assert.equal(cloudSettings({}).host,'127.0.0.1');assert.equal(cloudSettings(env).host,'0.0.0.0');
  for(const change of [{PUBLIC_ORIGIN:'http://example.com'},{PUBLIC_ORIGIN:'https://example.com/path'},{CLARITY_PROXY_KEY:'short'}])assert.throws(()=>cloudSettings({...env,...change}));
});
test('direct cloud assets and data require the gateway key, which cannot authorize bridge or migration',()=>{
  for(const path of ['/','/assets/app.js','/api/bootstrap','/api/export','/api/study/answer','/api/english/speech','/api/english/speech/audio/'+ 'a'.repeat(64)]){
    assert.equal(cloudAuthorized({headers:{}},path,env),false);
    assert.equal(cloudAuthorized({headers:{'x-clarity-proxy-key':'wrong'}},path,env),false);
    assert.equal(cloudAuthorized({headers:{'x-clarity-proxy-key':env.CLARITY_PROXY_KEY}},path,env),true);
  }
  assert.equal(cloudAuthorized({headers:{'x-clarity-proxy-key':env.CLARITY_PROXY_KEY}},'/api/bridge/claim',env),false);
  assert.equal(cloudAuthorized({headers:{'x-clarity-bridge-key':env.CLARITY_BRIDGE_KEY}},'/api/bridge/claim',env),true);
  assert.equal(cloudAuthorized({headers:{'x-clarity-proxy-key':env.CLARITY_PROXY_KEY}},'/api/bridge/speech/complete',env),false);
  assert.equal(cloudAuthorized({headers:{'x-clarity-bridge-key':env.CLARITY_BRIDGE_KEY}},'/api/bridge/speech/complete',env),true);
  assert.equal(cloudAuthorized({headers:{'x-clarity-bridge-key':env.CLARITY_BRIDGE_KEY}},'/api/english/speech/audio/'+ 'a'.repeat(64),env),false);
  assert.equal(cloudAuthorized({headers:{'x-clarity-proxy-key':env.CLARITY_PROXY_KEY}},'/api/admin/migrate',env),false);
  assert.equal(cloudAuthorized({headers:{'x-clarity-migration-key':env.CLARITY_MIGRATION_KEY}},'/api/admin/migrate',env),true);
});
