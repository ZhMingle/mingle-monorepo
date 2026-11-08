import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Store} from './lib/store.mjs';
import {incomingMessages,validSignature,categories,readiness} from './lib/policy.mjs';
import {findCodex} from './lib/ai.mjs';
import {processNext} from './lib/worker.mjs';

const root=fileURLToPath(new URL('.',import.meta.url));
export function createDesk({directory=process.env.DATA_DIR??resolve(root,'data'),adminPort=Number(process.env.PORT??4331),webhookPort=Number(process.env.WEBHOOK_PORT??4332),processOptions={}}={}){
  const store=new Store(directory);let processing=false;let stopping=false;
  async function drain(){if(processing||stopping)return;processing=true;try{while(!stopping&&await processNext(store,processOptions)){}}finally{processing=false;}}
  function json(res,code,value){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
  async function body(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1000000)throw Error('内容过长。');chunks.push(chunk);}return Buffer.concat(chunks);}
  const origins=new Set([`http://127.0.0.1:${adminPort}`,`http://localhost:${adminPort}`]);
  const admin=createServer(async(req,res)=>{
    res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
    const boundPort=admin.address()?.port??adminPort;
    if(![`127.0.0.1:${boundPort}`,`localhost:${boundPort}`].includes(req.headers.host)){json(res,403,{error:'仅供本机访问。'});return;}
    const url=new URL(req.url,'http://127.0.0.1');
    try{
      if(req.method==='GET'){
        if(url.pathname==='/api/state'){
          const settings=store.settings();json(res,200,{settings,connection:readiness(settings,store.secrets),verifyToken:store.secrets.verifyToken,aiInstalled:!!findCodex(),conversations:store.conversations(),jobs:store.jobs()});return;
        }
        if(url.pathname==='/api/conversation'){
          const id=url.searchParams.get('id')??'';json(res,200,{conversation:store.conversation(id),messages:store.messages(id),jobs:store.jobs().filter(j=>j.customer_id===id)});return;
        }
        if(url.pathname==='/api/export'){
          res.setHeader('Content-Disposition','attachment; filename="shop-inbox-export.json"');json(res,200,{exportedAt:new Date().toISOString(),conversations:store.conversations().map(c=>({...c,messages:store.messages(c.id)}))});return;
        }
        const files={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
        const file=files[url.pathname];if(file){res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'");res.setHeader('Content-Type',file[1]);res.end(await readFile(resolve(root,'public',file[0])));return;}
      }
      if(req.method!=='POST'||!origins.has(req.headers.origin)||req.headers['x-shop-request']!=='1'||!req.headers['content-type']?.startsWith('application/json')){json(res,403,{error:'只接受本机工作台请求。'});return;}
      const input=JSON.parse(await body(req));
      if(url.pathname==='/api/settings'){
        const old=store.settings();
        for(const key of ['shopName','pageId','graphVersion'])if(input[key]!==undefined&&(typeof input[key]!=='string'||input[key].length>150))throw Error('配置格式不正确。');
        if(input.pageId!==undefined&&!/^\d{5,30}$/.test(input.pageId))throw Error('主页 ID 必须是数字。');
        if(input.graphVersion&& !/^v\d+\.0$/.test(input.graphVersion))throw Error('API 版本格式如 v24.0，请使用应用支持的版本。');
        if(input.pageId!==undefined&&input.pageId!==old.pageId)throw Error('更换主页需要重新授权，当前版本不支持直接改绑。');
        const next={...old};for(const key of ['shopName','graphVersion'])if(input[key]!==undefined)next[key]=input[key].trim();
        if(input.business){
          const b=input.business;if(!Array.isArray(b.products)||!b.products.length||b.products.length>50||b.products.some(p=>typeof p!=='string'||!p.trim()||p.length>120))throw Error('请填写产品列表。');
          for(const key of ['priceRange','fulfilment','pickupAddress','postage','hours','details'])if(typeof b[key]!=='string'||b[key].length>8000)throw Error('商品资料格式不正确。');
          next.business=Object.fromEntries(['products','priceRange','fulfilment','pickupAddress','postage','hours','details'].map(key=>[key,b[key]]));
        }
        if(input.mode!==undefined){
          if(!['preview','auto'].includes(input.mode))throw Error('请选择预览或自动回复。');
          if(input.mode==='auto'&&(!Object.values(readiness(next,store.secrets)).every(Boolean)||input.confirmAuto!==true||!findCodex()))throw Error('请先完成主页令牌、应用密钥、API 版本、Webhook 验证和 AI 连接，再确认开启自动回复。');
          next.mode=input.mode;
        }
        store.setSettings(next);store.audit('settings_updated',{mode:next.mode});json(res,200,{saved:true});return;
      }
      if(url.pathname==='/api/secrets'){
        const patch={};for(const key of ['pageToken','appSecret'])if(input[key]){if(typeof input[key]!=='string'||input[key].length>4000)throw Error('密钥格式不正确。');patch[key]=input[key].trim();}
        store.saveSecrets(patch);json(res,200,{saved:true});return;
      }
      if(url.pathname==='/api/test'||url.pathname==='/api/import'){
        if(typeof input.text!=='string'||!input.text.trim()||input.text.length>8000)throw Error('请填写消息，最多 8000 个字符。');
        const source=url.pathname==='/api/test'?'test':'import';const id=`${source}-${randomUUID()}`;
        store.receive({id:randomUUID(),customerId:id,text:input.text.trim(),timestamp:Date.now(),attachment:false,source});
        const c=store.conversation(id);c.name=source==='test'?'测试客人':typeof input.name==='string'?input.name.slice(0,120)||'历史客人':'历史客人';store.saveConversation(c);
        void drain();json(res,200,{id});return;
      }
      if(url.pathname==='/api/conversation'){
        const c=store.conversation(input.id);if(!c)throw Error('对话不存在。');
        for(const key of ['paused','archived','confirmedPurchase'])if(input[key]!==undefined){if(typeof input[key]!=='boolean')throw Error('对话状态格式不正确。');c[key]=input[key];}
        if(input.category!==undefined){if(!categories.includes(input.category))throw Error('无效分类。');if(input.category==='purchased'&&!c.confirmedPurchase)throw Error('请先确认已成交。');c.manualCategory=input.category;c.category=input.category;}
        if(input.confirmedPurchase===true){c.category='purchased';c.manualCategory='purchased';}
        if(input.confirmedPurchase===false&&c.category==='purchased'){c.category='interested';c.manualCategory=null;}
        for(const key of ['note','name'])if(input[key]!==undefined){if(typeof input[key]!=='string'||input[key].length>(key==='note'?3000:120))throw Error('备注或名字过长。');c[key]=input[key];}
        store.saveConversation(c);store.audit('conversation_updated',{customerId:c.id});json(res,200,{saved:true});return;
      }
      if(url.pathname==='/api/retry'){
        const job=store.job(input.id);if(!job||!['error','paused','preview'].includes(job.state))throw Error('此状态不能直接重试；发送结果不明时需先核对 Messenger。');
        store.saveJob(job.id,'pending',{error:null});void drain();json(res,200,{queued:true});return;
      }
      json(res,404,{error:'未找到此操作。'});
    }catch(e){json(res,400,{error:e.message});}
  });
  const webhook=createServer(async(req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname!=='/webhook'){json(res,404,{error:'Not found'});return;}
    if(req.method==='GET'){
      if(url.searchParams.get('hub.mode')==='subscribe'&&url.searchParams.get('hub.verify_token')===store.secrets.verifyToken&&url.searchParams.has('hub.challenge')){
        store.setSettings({...store.settings(),webhookVerifiedAt:new Date().toISOString()});res.writeHead(200,{'Content-Type':'text/plain'});res.end(url.searchParams.get('hub.challenge'));return;
      }json(res,403,{error:'Verification failed'});return;
    }
    if(req.method!=='POST'){json(res,405,{error:'Method not allowed'});return;}
    try{
      const raw=await body(req);if(!validSignature(raw,req.headers['x-hub-signature-256'],store.secrets.appSecret)){json(res,401,{error:'Invalid signature'});return;}
      for(const m of incomingMessages(JSON.parse(raw),store.settings().pageId))store.receive(m);
      json(res,200,{received:true});void drain();
    }catch{json(res,400,{error:'Invalid webhook payload'});}
  });
  const timer=setInterval(()=>void drain(),2500);timer.unref();
  return {store,admin,webhook,drain,async start(){await Promise.all([new Promise((ok,no)=>{admin.once('error',no);admin.listen(adminPort,'127.0.0.1',ok);}),new Promise((ok,no)=>{webhook.once('error',no);webhook.listen(webhookPort,'127.0.0.1',ok);})]);void drain();},async close(){stopping=true;clearInterval(timer);await Promise.all([new Promise(ok=>admin.close(ok)),new Promise(ok=>webhook.close(ok))]);while(processing)await new Promise(ok=>setTimeout(ok,20));store.close();}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const desk=createDesk();await desk.start();console.log(`工作台：http://127.0.0.1:${process.env.PORT??4331}/`);console.log(`Webhook：http://127.0.0.1:${process.env.WEBHOOK_PORT??4332}/webhook（尚未公开，需配置 HTTPS 接入地址）`);
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>void desk.close().then(()=>process.exit(0)));
}
