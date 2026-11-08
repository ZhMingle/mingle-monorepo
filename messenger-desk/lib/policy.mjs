import {createHmac,timingSafeEqual} from 'node:crypto';
export const categories=['greeting','interested','planned','purchased','needs_attention'];
export function validSignature(raw,header,secret){
  if(!secret||typeof header!=='string'||!/^sha256=[a-f0-9]{64}$/.test(header))return false;
  const actual=Buffer.from(header.slice(7),'hex');
  return timingSafeEqual(actual,createHmac('sha256',secret).update(raw).digest());
}
export function incomingMessages(payload,pageId,now=Date.now()){
  if(payload?.object!=='page'||!Array.isArray(payload.entry))throw Error('Not a Page webhook.');
  const messages=[];
  for(const entry of payload.entry){
    if(String(entry.id)!==pageId)continue;
    for(const event of Array.isArray(entry.messaging)?entry.messaging:[]){
      if(event.message?.is_echo||event.sender?.id===pageId||String(event.recipient?.id)!==pageId)continue;
      if(typeof event.sender?.id!=='string'||!/^\d+$/.test(event.sender.id)||typeof event.message?.mid!=='string')continue;
      const timestamp=Number(event.timestamp);
      if(!Number.isFinite(timestamp)||timestamp<0||timestamp>now+60000)continue;
      const text=typeof event.message.text==='string'?event.message.text.slice(0,8000):'';
      messages.push({id:event.message.mid,customerId:event.sender.id,text,timestamp,attachment:!text,source:'messenger'});
    }
  }
  return messages;
}
export function replyAllowed({source,lastCustomerAt,paused},now=Date.now()){
  return source==='messenger'&&!paused&&Number.isFinite(lastCustomerAt)&&now>=lastCustomerAt&&now-lastCustomerAt<24*60*60*1000;
}
export function validateDecision(raw){
  if(!raw||typeof raw.reply!=='string'||!raw.reply.trim()||raw.reply.length>1800||!categories.includes(raw.category)||typeof raw.summary!=='string'||raw.summary.length>400||typeof raw.needsOwner!=='boolean'||typeof raw.reason!=='string'||raw.reason.length>400)throw Error('AI 返回的回复或分类不完整，请重试。');
  // A customer's own claim is not proof of a completed sale.
  return {reply:raw.reply,category:raw.category==='purchased'?'needs_attention':raw.category,summary:raw.summary,needsOwner:raw.needsOwner||raw.category==='purchased',reason:raw.reason};
}
export function readiness(settings,secrets){
  return {page:!!settings.pageId,token:!!secrets.pageToken,appSecret:!!secrets.appSecret,graphVersion:/^v\d+\.0$/.test(settings.graphVersion??''),webhook:!!settings.webhookVerifiedAt};
}
