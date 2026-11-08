import {generateReply} from './ai.mjs';
import {replyAllowed,validateDecision,readiness} from './policy.mjs';
export async function sendMeta(settings,secrets,customerId,text,fetcher=fetch){
  const ready=readiness(settings,secrets);if(!ready.page||!ready.token||!ready.graphVersion)throw Error('主页令牌或 Graph API 版本尚未配置。');
  const response=await fetcher(`https://graph.facebook.com/${settings.graphVersion}/${settings.pageId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${secrets.pageToken}`,'Content-Type':'application/json'},body:JSON.stringify({recipient:{id:customerId},messaging_type:'RESPONSE',message:{text}}),signal:AbortSignal.timeout(15000)});
  const body=await response.json();
  if(!response.ok||!body.message_id)throw Error(`Meta 未确认发送成功（${response.status}）。请先检查 Messenger 收件箱，避免重复发送。`);
  return body.message_id;
}
export async function processNext(store,{generate=generateReply,send=sendMeta,now=()=>Date.now()}={}){
  const job=store.nextJob();if(!job)return false;
  let conversation=store.conversation(job.customer_id);
  if(!conversation||conversation.latestMessageId!==job.id){store.saveJob(job.id,'superseded');return true;}
  if(conversation.paused){store.saveJob(job.id,'paused');return true;}
  if(job.attachment){store.saveJob(job.id,'needs_attention',{error:'这条消息含图片、语音或其他附件，需要人工查看。'});conversation.category='needs_attention';store.saveConversation(conversation);return true;}
  store.saveJob(job.id,'analyzing');
  try{
    const decision=validateDecision(await generate(store.settings().business,store.messages(conversation.id)));
    // Owner edits and newer customer messages win over an in-flight AI job.
    conversation=store.conversation(job.customer_id);
    if(conversation.latestMessageId!==job.id){store.saveJob(job.id,'superseded');return true;}
    conversation.category=conversation.confirmedPurchase?'purchased':conversation.manualCategory??decision.category;
    conversation.summary=decision.summary;conversation.needsOwner=decision.needsOwner;store.saveConversation(conversation);
    store.saveJob(job.id,'preview',{decision});
    const settings=store.settings();const ready=readiness(settings,store.secrets);
    if(settings.mode!=='auto'||!Object.values(ready).every(Boolean)||!replyAllowed(conversation,now()))return true;
    // A pause or mode change while AI was running must take effect before delivery.
    if(store.conversation(conversation.id).paused||store.settings().mode!=='auto')return true;
    store.saveJob(job.id,'sending');
    try{
      const mid=await send(settings,store.secrets,conversation.id,decision.reply);
      store.sent(conversation.id,decision.reply,mid);store.saveJob(job.id,'sent',{metaMessageId:mid});
      store.audit('message_sent',{customerId:conversation.id,jobId:job.id,metaMessageId:mid});
    }catch{store.saveJob(job.id,'delivery_unknown',{error:'发送结果未确认。请先检查 Messenger，系统不会自动重发。'});}
  }catch(e){store.saveJob(job.id,'error',{error:e.message});}
  return true;
}
