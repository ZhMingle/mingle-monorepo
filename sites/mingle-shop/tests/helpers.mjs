import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { handleShopRequest } from '../lib/shop-server.mjs';
import { defaults } from '../lib/commerce.mjs';
export function fixture() {
  const sql = new DatabaseSync(':memory:'); sql.exec('PRAGMA foreign_keys=ON');
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(x=>x.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
  const db = { prepare(query) { return { query, args: [], bind(...args) { this.args=args; return this; }, async first() { return sql.prepare(this.query).get(...this.args) || null; }, async all() { return { results:sql.prepare(this.query).all(...this.args) }; }, async run() { const result=sql.prepare(this.query).run(...this.args); return {meta:{changes:Number(result.changes)}}; } }; }, async batch(statements) { sql.exec('BEGIN'); try {const results=[]; for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;} } };
  const settings={...defaults,contactEmail:'owner@example.test',pickupEnabled:true,pickupDetails:'Confirmed pickup details',returnPolicy:'Contact the shop for returns.',privacyPolicy:'Order data is used for fulfilment.',checkoutEnabled:true};
  sql.prepare('INSERT INTO shop_settings VALUES(1,?)').run(JSON.stringify(settings));
  sql.prepare('INSERT INTO products(id,name,category,price_cents,minimum_cents,stock,enabled,negotiable,bulk_percent,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run('lamp','Test lamp','台灯',5000,4000,3,1,1,10,Date.now());
  const env={DB:db,OWNER_EMAIL:'owner@example.test',STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',STORE_ORIGIN:'https://shop.example.test'};
  let cookie='',calls=0,session;
  const fetcher=async(url,options)=>{calls++;const p=new URLSearchParams(options.body);session={id:'cs_test_fixture',url:'https://checkout.stripe.com/c/pay/fixture',metadata:{order_id:p.get('metadata[order_id]')},currency:'nzd',amount_total:Number(p.get('line_items[0][price_data][unit_amount]'))*Number(p.get('line_items[0][quantity]')),livemode:false,status:'open',payment_status:'unpaid',customer_details:{email:'customer@example.test'}};return Response.json(session);};
  const request=async(path,input,admin=false,options={})=>{const response=await handleShopRequest(new Request('https://shop.example.test/api/'+path,{method:input===undefined?'GET':'POST',headers:{origin:'https://shop.example.test','content-type':'application/json',...(cookie?{cookie}:{}),...(admin?{'oai-authenticated-user-id':'owner-site-id','oai-authenticated-user-email':'owner@example.test'}:{}),...options.headers},...(input===undefined?{}:{body:JSON.stringify(input)})}),env,{stripeFetch:fetcher,...options});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return {status:response.status,data:await response.json()};};
  const webhook=async(event,valid=true)=>{const body=JSON.stringify(event),t=Math.floor(Date.now()/1000);const signature=createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(t+'.'+body).digest('hex');const res=await handleShopRequest(new Request('https://shop.example.test/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':'t='+t+',v1='+(valid?signature:'0'.repeat(64))},body}),env);return {status:res.status,data:await res.json()};};
  return {sql,env,request,webhook,session:()=>session,calls:()=>calls};
}
