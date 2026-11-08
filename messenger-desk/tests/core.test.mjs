import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Store} from '../lib/store.mjs';
import {validSignature,incomingMessages,replyAllowed,validateDecision} from '../lib/policy.mjs';
import {processNext,sendMeta} from '../lib/worker.mjs';
import {createDesk} from '../server.mjs';
const reply={reply:'Hi! Which lamp are you interested in? I can confirm the price and postage for you.',category:'interested',summary:'客人询问台灯价格和邮寄。',needsOwner:true,reason:'具体单价和邮费尚未提供。'};
function fixture(t){const directory=mkdtempSync(join(tmpdir(),'shop-test-'));const store=new Store(directory);t.after(()=>{store.close();rmSync(directory,{recursive:true,force:true});});return store;}
function receive(store,id='m1',source='messenger',timestamp=Date.now()){store.receive({id,customerId:'123456789',text:'How much is the lamp?',timestamp,source,attachment:false});}
function auto(store){store.saveSecrets({pageToken:'TEST-TOKEN',appSecret:'TEST-SECRET'});store.setSettings({...store.settings(),mode:'auto',graphVersion:'v24.0',webhookVerifiedAt:new Date().toISOString()});}
test('webhook validates exact raw-body HMAC and rejects missing or malformed signatures',()=>{
  const raw='{"object":"page"}';const signature='sha256='+createHmac('sha256','secret').update(raw).digest('hex');
  assert.equal(validSignature(raw,signature,'secret'),true);assert.equal(validSignature(raw+' ',signature,'secret'),false);
  for(const header of ['',undefined,'sha256=aa','sha256='+'x'.repeat(64)])assert.equal(validSignature(raw,header,'secret'),false);
});
test('only matching Page inbound messages are accepted; echo and future events cannot trigger replies',()=>{
  const now=Date.now();const event={sender:{id:'123'},recipient:{id:'999'},timestamp:now,message:{mid:'mid',text:'Hi'}};
  const payload={object:'page',entry:[{id:'999',messaging:[event,{...event,message:{...event.message,is_echo:true}},{...event,timestamp:now+100000}]}]};
  assert.equal(incomingMessages(payload,'999',now).length,1);assert.equal(incomingMessages(payload,'888',now).length,0);
  assert.equal(incomingMessages({...payload,entry:[{id:'999',messaging:[{...event,message:{mid:'attachment',attachments:[{}]}}]}]},'999',now)[0].attachment,true);
});
test('reply window and sources prevent stale or imported chats from being sent',()=>{
  const now=Date.now();const c={source:'messenger',paused:false,lastCustomerAt:now-1000};assert.equal(replyAllowed(c,now),true);
  for(const patch of [{paused:true},{source:'import'},{source:'test'},{lastCustomerAt:now+1},{lastCustomerAt:now-86400000}])assert.equal(replyAllowed({...c,...patch},now),false);
  assert.equal(validateDecision({...reply,category:'purchased'}).category,'needs_attention');assert.throws(()=>validateDecision({...reply,reply:''}),/不完整/);
});
test('messages deduplicate durably and preview mode never sends',async t=>{
  const s=fixture(t);let sends=0;receive(s);receive(s);assert.equal(s.messages('123456789').length,1);
  await processNext(s,{generate:async()=>reply,send:async()=>{sends++;return 'out';}});
  assert.equal(s.job('m1').state,'preview');assert.equal(sends,0);assert.equal(s.conversation('123456789').category,'interested');
  assert.equal(await processNext(s),false);
});
test('auto mode sends a matching new message once and keeps a permanent outbound receipt',async t=>{
  const s=fixture(t);auto(s);receive(s);let calls=0;
  const options={generate:async()=>reply,send:async()=>{calls++;return 'meta-out-1';}};
  await processNext(s,options);receive(s);await processNext(s,options);
  assert.equal(calls,1);assert.equal(s.job('m1').state,'sent');assert.equal(s.messages('123456789').filter(m=>m.direction==='out').length,1);
});
test('imported chats and expired inbound messages stay previews even with automatic mode enabled',async t=>{
  const s=fixture(t);auto(s);let sends=0;const options={generate:async()=>reply,send:async()=>{sends++;return 'out';}};
  receive(s,'import','import');await processNext(s,options);assert.equal(sends,0);
  const c=s.conversation('123456789');c.source='messenger';c.lastCustomerAt=0;s.saveConversation(c);
  receive(s,'expired','messenger',Date.now()-86400001);await processNext(s,options);assert.equal(sends,0);
});
test('new messages, owner category edits and pauses win over an in-flight AI result',async t=>{
  const s=fixture(t);auto(s);receive(s);let sends=0;
  await processNext(s,{generate:async()=>{const c=s.conversation('123456789');c.paused=true;c.confirmedPurchase=true;c.manualCategory='purchased';s.saveConversation(c);return reply;},send:async()=>{sends++;return 'out';}});
  assert.equal(sends,0);assert.equal(s.conversation('123456789').category,'purchased');
  const c=s.conversation('123456789');c.paused=false;s.saveConversation(c);receive(s,'m2');
  await processNext(s,{generate:async()=>{receive(s,'m3', 'messenger',Date.now()+1);return reply;},send:async()=>{sends++;return 'out';}});
  assert.equal(s.job('m2').state,'superseded');assert.equal(sends,0);
});
test('AI failures preserve messages; ambiguous delivery is never automatically retried',async t=>{
  const s=fixture(t);auto(s);receive(s);
  await processNext(s,{generate:async()=>{throw Error('Offline');}});assert.equal(s.job('m1').state,'error');assert.equal(s.messages('123456789').length,1);
  s.saveJob('m1','pending');let calls=0;
  await processNext(s,{generate:async()=>reply,send:async()=>{calls++;throw Error('timeout');}});
  assert.equal(s.job('m1').state,'delivery_unknown');assert.equal(await processNext(s),false);assert.equal(calls,1);
});
test('restart preserves conversations, resumes analysis and quarantines interrupted sends',t=>{
  const directory=mkdtempSync(join(tmpdir(),'shop-restart-'));let s=new Store(directory);
  receive(s);s.saveJob('m1','sending');s.close();s=new Store(directory);
  assert.equal(s.job('m1').state,'delivery_unknown');assert.equal(s.messages('123456789').length,1);s.close();rmSync(directory,{recursive:true,force:true});
});
test('Meta sending uses an authorization header, actual Page ID and validates the result',async()=>{
  let request;const id=await sendMeta({pageId:'999',graphVersion:'v24.0'},{pageToken:'secret'},'123','hello',async(url,options)=>{request={url,options};return {ok:true,json:async()=>({message_id:'real-mid'})};});
  assert.equal(id,'real-mid');assert.equal(request.url,'https://graph.facebook.com/v24.0/999/messages');assert.ok(!request.url.includes('secret'));assert.equal(request.options.headers.Authorization,'Bearer secret');
  assert.equal(JSON.parse(request.options.body).messaging_type,'RESPONSE');
});
test('public receiver exposes no admin API, verifies callback and rejects unsigned messages',async t=>{
  const directory=mkdtempSync(join(tmpdir(),'shop-http-'));
  const desk=createDesk({directory,adminPort:0,webhookPort:0,processOptions:{generate:async()=>reply}});await desk.start();
  t.after(async()=>{await desk.close();rmSync(directory,{recursive:true,force:true});});
  const base='http://127.0.0.1:'+desk.webhook.address().port;
  assert.equal((await fetch(base+'/api/state')).status,404);
  assert.equal((await fetch(base+'/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc')).status,403);
  const verify=new URLSearchParams({'hub.mode':'subscribe','hub.verify_token':desk.store.secrets.verifyToken,'hub.challenge':'test-challenge'});
  const result=await fetch(base+'/webhook?'+verify);assert.equal(await result.text(),'test-challenge');assert.ok(desk.store.settings().webhookVerifiedAt);
  assert.equal((await fetch(base+'/webhook',{method:'POST',body:'{}'})).status,401);
  desk.store.saveSecrets({appSecret:'secret'});
  const adminState=await (await fetch('http://127.0.0.1:'+desk.admin.address().port+'/api/state')).json();
  assert.equal(adminState.connection.appSecret,true);assert.equal(adminState.secrets,undefined);assert.equal(adminState.appSecret,undefined);
  const payload=JSON.stringify({object:'page',entry:[{id:desk.store.settings().pageId,messaging:[{sender:{id:'123456789'},recipient:{id:desk.store.settings().pageId},timestamp:Date.now(),message:{mid:'http-mid',text:'hi'}}]}]});
  const signature='sha256='+createHmac('sha256','secret').update(payload).digest('hex');
  assert.equal((await fetch(base+'/webhook',{method:'POST',headers:{'X-Hub-Signature-256':signature},body:payload})).status,200);
  assert.equal(desk.store.messages('123456789').length,1);
});
