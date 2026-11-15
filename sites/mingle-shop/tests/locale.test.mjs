import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.mjs';
import {translate} from '../lib/locale.mjs';

test('English labels preserve category identifiers and unknown product content',async()=>{
  const f=fixture();
  const {data}=await f.request('bootstrap');
  assert.ok(data.categories.includes('键盘'));
  assert.equal(translate('en','键盘'),'Keyboards');
  assert.equal(translate('zh','键盘'),'键盘');
  assert.equal(translate('en','Alice80 – Wired RGB'),'Alice80 – Wired RGB');
  assert.equal(translate('en','打开购物袋，共 1 件'),'Open shopping bag, 1 item');
  assert.equal(translate('en','查看视频 2'),'View video 2');
  f.sql.close();
});

test('English and Chinese errors keep the same access controls and stock checks',async()=>{
  const f=fixture();
  const en=await f.request('admin');
  const zh=await f.request('admin',undefined,false,{headers:{'X-Shop-Language':'zh'}});
  assert.equal(en.status,403);
  assert.equal(zh.status,403);
  assert.match(en.data.error,/shop owner account/);
  assert.equal(zh.data.error,'请使用店主账号登录。');
  const stock=await f.request('quote',{items:[{id:'lamp',quantity:4}],fulfilment:'pickup'});
  assert.equal(stock.status,409);
  assert.match(stock.data.error,/Not enough stock for Test lamp/);
  assert.equal(f.sql.prepare('SELECT reserved FROM products WHERE id=?').get('lamp').reserved,0);
  f.sql.close();
});

test('selected chat language controls saved automatic replies without changing quotes',async()=>{
  const f=fixture();
  const input={text:'可以便宜一点吗？',productId:'lamp',quantity:1,offerCents:3000,language:'en'};
  const en=await f.request('chat',input);
  assert.equal(en.status,200);
  assert.equal(en.data.quote.unitCents,4000);
  let history=(await f.request('chat')).data.messages;
  assert.match(history.at(-1).text,/NZ\$40\.00 each/);
  assert.doesNotMatch(history.at(-1).text,/[\u3400-\u9fff]/);
  const zh=await f.request('chat',{...input,text:'Can you offer a discount?',language:'zh'});
  assert.equal(zh.data.quote.unitCents,4000);
  history=(await f.request('chat')).data.messages;
  assert.match(history.at(-1).text,/每件 NZ\$40\.00/);
  f.sql.close();
});
