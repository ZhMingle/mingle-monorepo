const $=id=>document.getElementById(id);
const labels={all:'全部客人',needs_attention:'待我处理',planned:'约好来 / 想购买',interested:'正在咨询',purchased:'已经买过',greeting:'仅打招呼',archived:'已归档'};
const jobLabels={pending:'等待 AI 整理',analyzing:'AI 正在整理，可能需要几十秒',preview:'回复预览 · 尚未发送',sent:'已发送到 Messenger',error:'AI 处理失败',delivery_unknown:'发送结果不明，请先核对 Messenger',superseded:'已有更新消息',paused:'已暂停',needs_attention:'需要人工查看附件'};
let state=null,selected='',filter='all',search='',detailKey='',fetching=false;
function node(tag,attrs={},children=[]){const e=document.createElement(tag);for(const [k,v]of Object.entries(attrs)){if(k.startsWith('on'))e.addEventListener(k.slice(2).toLowerCase(),v);else if(k==='text')e.textContent=v;else e.setAttribute(k,v);}for(const c of [].concat(children)){if(c!==null&&c!==undefined)e.append(typeof c==='string'?document.createTextNode(c):c);}return e;}
async function api(path,data){const res=await fetch('/api/'+path,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-Shop-Request':'1'},body:JSON.stringify(data)});const result=await res.json();if(!res.ok)throw Error(result.error??'请求失败');return result;}
function showError(error){$('error').hidden=false;$('error').textContent=error.message??String(error);}
function notice(text){$('notice').textContent=text;$('notice').hidden=false;}
function time(t){return new Date(t).toLocaleString('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
function current(){return state?.conversations.find(c=>c.id===selected);}
async function change(input){await api('conversation',{id:selected,...input});detailKey='';await load();}
function button(text,fn,cls=''){return node('button',{type:'button',class:cls,onClick:async()=>{try{await fn();}catch(e){showError(e);}}},text);}
function render(){
  const counts={};for(const key of Object.keys(labels))counts[key]=state.conversations.filter(c=>key==='archived'?c.archived:!c.archived&&(key==='all'||(key==='needs_attention'?(c.needsOwner||c.category===key):c.category===key))).length;
  $('filters').replaceChildren(...Object.entries(labels).map(([id,label])=>button(label+`　${counts[id]}`,()=>{filter=id;render();},filter===id?'active':'')));
  $('mode-status').textContent=state.settings.mode==='auto'?'自动回复已开启':'预览模式 · 不会向客人发送消息';
  const missing=Object.entries(state.connection).filter(([,v])=>!v).map(([k])=>({page:'主页',token:'消息令牌',appSecret:'应用密钥',graphVersion:'API 版本',webhook:'接收地址验证'})[k]);
  $('connection-status').textContent=missing.length?'还需配置：'+missing.join('、'):'主页接入资料已配置；请用测试账号验证实际收发';
  $('pause-all').hidden=state.settings.mode!=='auto';
  $('list-title').textContent=labels[filter];
  const cards=state.conversations.filter(c=>(filter==='archived'?c.archived:!c.archived&&(filter==='all'||(filter==='needs_attention'?(c.needsOwner||c.category===filter):c.category===filter)))&&[c.name,c.note,c.lastMessage,c.summary].join(' ').toLowerCase().includes(search.toLowerCase()));
  $('count').textContent=cards.length+' 位';
  $('conversation-list').replaceChildren(...(cards.length?cards.map(c=>node('button',{class:'customer '+(selected===c.id?'selected':''),onClick:()=>{selected=c.id;detailKey='';void loadDetail().catch(showError);}},[
    node('span',{class:'avatar'},c.name.slice(0,1)),node('span',{class:'customer-info'},[node('strong',{},c.name),node('span',{},c.lastMessage??''),node('small',{},[(labels[c.category]??'未分类')+' · '+time(c.updatedAt),c.source==='messenger'?'':' · '+(c.source==='test'?'测试':'旧聊天')])])
  ])):[node('div',{class:'list-empty'},['还没有这类客人。',node('p',{},'新消息会自动保存，不必再删除聊天窗口。')])]));
  if(selected)void loadDetail().catch(showError);
}
async function loadDetail(){
  const id=selected;if(!id)return;
  const signature=JSON.stringify([id,current(),state.jobs.filter(j=>j.customer_id===id)]);
  if(signature===detailKey||$('detail').contains(document.activeElement))return;
  const result=await api('conversation?id='+encodeURIComponent(id));if(selected!==id)return;detailKey=signature;
  const c=result.conversation;if(!c)return;
  const select=node('select',{'aria-label':'客户分类',onChange:e=>void change({category:e.target.value}).catch(showError)});
  for(const [key,label]of Object.entries(labels))if(!['all','archived','purchased'].includes(key)||c.confirmedPurchase){if(['all','archived'].includes(key))continue;const option=node('option',{value:key},label);option.selected=c.category===key;select.append(option);}
  const name=node('input',{value:c.name,'aria-label':'客人姓名',maxlength:'120',class:'name-input'});
  name.addEventListener('change',()=>void change({name:name.value}).catch(showError));
  const note=node('textarea',{rows:'2',maxlength:'3000',placeholder:'记一下产品、约定时间或其他需要留意的事…','aria-label':'客人备注'});note.value=c.note??'';
  const latest=result.jobs.find(j=>j.id===c.latestMessageId);
  const detail=[node('div',{class:'detail-heading'},[name,node('span',{class:'badge'},c.source==='messenger'?'Messenger':c.source==='test'?'测试 · 不发送':'旧聊天 · 不发送')]),
    node('div',{class:'customer-controls'},[select,button(c.paused?'恢复此客人自动回复':'暂停此客人自动回复',()=>change({paused:!c.paused})),button(c.archived?'移回收件箱':'归档',()=>change({archived:!c.archived})),button(c.confirmedPurchase?'撤销成交标记':'确认已经成交',()=>change({confirmedPurchase:!c.confirmedPurchase}),c.confirmedPurchase?'bought':'')]),
    c.summary?node('div',{class:'summary'},c.summary):null,
    node('div',{class:'messages'},result.messages.map(m=>node('div',{class:'message '+(m.direction==='out'?'out':'in')},[node('span',{},m.direction==='out'?'店铺回复':c.source==='import'?'历史对话':'客人'),node('p',{},m.text||'[附件，需要在 Messenger 中查看]'),node('small',{},time(m.timestamp))]))),
    latest?node('section',{class:'reply-preview'},[node('div',{class:'preview-heading'},[node('strong',{},jobLabels[latest.state]??latest.state),latest.state==='sent'?node('span',{class:'badge'},'已发送'):null]),latest.decision?node('p',{},latest.decision.reply):null,latest.error?node('p',{class:'form-error'},latest.error):null,latest.decision?.needsOwner?node('small',{},'需要你确认：'+latest.decision.reason):null,['error','paused'].includes(latest.state)?button('重新生成回复',async()=>{await api('retry',{id:latest.id});detailKey='';await load();}):null]):null,
    node('section',{class:'notes'},[node('h3',{},'只给自己看的备注'),note,button('保存备注',async()=>{await change({note:note.value});notice('备注已保存。');})])];
  $('detail').replaceChildren(...detail.filter(Boolean));
}
async function load(){if(fetching)return;fetching=true;try{state=await api('state');render();}catch(e){showError(e);}finally{fetching=false;}}
$('search').addEventListener('input',e=>{search=e.target.value;render();});
$('pause-all').addEventListener('click',async()=>{try{await api('settings',{mode:'preview'});await load();notice('已停止新的自动发送。已经提交给 Meta 的消息无法撤回。');}catch(e){showError(e);}});
for(const e of document.querySelectorAll('[data-close]'))e.addEventListener('click',()=>$ (e.dataset.close).close());
$('test-open').addEventListener('click',()=>$('test-dialog').showModal());
$('import-open').addEventListener('click',()=>$('import-dialog').showModal());
$('settings-open').addEventListener('click',()=>{
  if(!state)return;const form=$('settings-form');const s=state.settings;
  for(const key of ['shopName','graphVersion','mode'])form.elements[key].value=s[key];
  for(const key of ['products','priceRange','fulfilment','pickupAddress','postage','hours','details'])form.elements[key].value=key==='products'?s.business.products.join('\n'):s.business[key];
  form.elements.pageToken.value='';form.elements.appSecret.value='';
  $('verify-token').value=state.verifyToken;
  $('page-info').textContent=`主页：${s.pageId} · 应用：${s.appId}。令牌${state.connection.token?'已保存':'未配置'}，应用密钥${state.connection.appSecret?'已保存':'未配置'}。`;
  $('settings-error').textContent='';$('settings-dialog').showModal();
});
$('settings-form').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.target;const b=form.elements;const submit=form.querySelector('[type=submit]');submit.disabled=true;
  try{
    const mode=b.mode.value;const enabling=mode==='auto'&&state.settings.mode!=='auto';
    if(enabling&&!confirm('开启后，软件会把 AI 生成的回复自动发送给已连接主页的新消息客人。请先完成一次收发测试并确认商品资料。现在开启吗？'))return;
    if(b.pageToken.value||b.appSecret.value)await api('secrets',{pageToken:b.pageToken.value,appSecret:b.appSecret.value});
    const business={products:b.products.value.split('\n').map(s=>s.trim()).filter(Boolean)};
    for(const key of ['priceRange','fulfilment','pickupAddress','postage','hours','details'])business[key]=b[key].value;
    await api('settings',{shopName:b.shopName.value,graphVersion:b.graphVersion.value,business,mode,confirmAuto:enabling||mode==='auto'});
    $('settings-dialog').close();detailKey='';await load();notice('配置已保存。');
  }catch(e){$('settings-error').textContent=e.message;}finally{submit.disabled=false;}
});
for(const kind of ['test','import'])$(kind+'-form').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.target;const submit=form.querySelector('[type=submit]');submit.disabled=true;form.querySelector('.form-error').textContent='';
  try{const result=await api(kind,{text:form.elements.text.value,name:form.elements.name?.value});selected=result.id;filter='all';search='';$('search').value='';detailKey='';$(kind+'-dialog').close();form.reset();await load();notice('已保存，AI 正在整理。测试和旧聊天不会发送到 Facebook。');}
  catch(e){form.querySelector('.form-error').textContent=e.message;}finally{submit.disabled=false;}
});
void load();setInterval(()=>{if(!document.hidden)void load();},3000);
