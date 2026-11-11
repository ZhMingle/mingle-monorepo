const $=s=>document.querySelector(s);const categories=[{id:'promo',name:'促销优惠',icon:'◇',color:'#b28a53',tint:'#f7efe2',hint:'好物很多，按需留下'},{id:'sub',name:'订阅资讯',icon:'▤',color:'#7b8b68',tint:'#eef2e6',hint:'让阅读回归你的节奏'},{id:'notice',name:'通知提醒',icon:'♧',color:'#6f8f9d',tint:'#eaf1f4',hint:'及时知晓，适时清理'},{id:'bill',name:'账单凭证',icon:'▧',color:'#9a83a7',tint:'#f1ecf5',hint:'重要凭证，妥善保留'},{id:'personal',name:'个人往来',icon:'♙',color:'#be8c7c',tint:'#f8eee9',hint:'重要的人，值得关注'}];
const seeds=[['MUJI 无印良品','muji.com','秋日生活提案 | 会员专属 8 折好物','让生活回到简单，从一件舒适的日常好物开始。','promo'],['Notion','makenotion.com','本周灵感已送达：打造属于你的知识花园','五分钟，发现让工作更有条理的新方法。','sub'],['GitHub','github.com','[mingle-monorepo] 你的 Pull Request 已合并','所有检查已通过，代码已经成功合并至 main 分支。','notice'],['Apple','apple.com','你的 Apple 收据','感谢你的购买。请保留这封邮件作为付款凭证。','bill'],['林小满','xiaoman.me','周末去海边走走？','听说这周末天气不错，一起去看看海吧。','personal'],['UNIQLO 优衣库','uniqlo.com','限时优惠 · 秋冬新品温暖上新','你的心愿清单，现在有了更心动的价格。','promo'],['少数派','sspai.com','一周精选：数字生活的另一种可能','关于效率、工具，以及那些值得认真对待的小事。','sub'],['Figma','figma.com','有人在你的设计文件中留下了评论','打开文件，查看团队成员的最新反馈。','notice'],['Spotify','spotify.com','你的 Premium 月度账单','本月订阅付款已完成，音乐继续陪伴。','bill'],['陈一舟','studio.design','Re: 下周的设计讨论','我把新的方向整理好了，期待听听你的想法。','personal'],['Nike','nike.com','会员专享：精选鞋款折扣','为下一次出发，找到合适的装备。','promo'],['Product Hunt','producthunt.com','今日值得发现的新产品 · Weekly newsletter','本周创意工具合集和开发者故事。','sub'],['京东','jd.com','年终大促优惠券已到账','限时折扣，优惠券即将到期。','promo'],['Medium','medium.com','Your daily digest: ideas worth reading','Weekly newsletter with stories selected for you.','sub'],['Google','google.com','账号安全提醒：新设备登录','请确认本次登录是否由你本人操作。','notice'],['Air New Zealand','airnz.co.nz','电子机票与付款收据','请保存行程确认信息与电子收据。','bill'],['张可','example.com','项目资料整理好了','附件目录已经更新，明天下午一起过一下。','personal'],['Amazon','amazon.com','Sale: your exclusive offer ends soon','Save on your favorite products today.','promo']];
let demo=true,token='',expires=0,busy=false,current='all',filter='all',selected=new Set(),mails=[],undo=null;const DAY=86400000;
function reset(){mails=seeds.map((x,i)=>({id:'demo-'+i,from:x[0],email:'hello@'+x[1],subject:x[2],snippet:x[3],cat:x[4],date:Date.now()-i*4*DAY,unread:i%3!==1,trash:false,labels:['INBOX',...(i%3!==1?['UNREAD']:[])]}));selected.clear();undo=null;render()}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function cat(m){return categories.find(c=>c.id===m.cat)||categories[4]}function style(c){return `--color:${c.color};--tint:${c.tint}`}function visible(){const q=$('#search').value.trim().toLowerCase();return mails.filter(m=>(current==='trash'?m.trash:!m.trash)&&(current==='all'||current==='trash'||m.cat===current)&&(filter!=='unread'||m.unread)&&(filter!=='old'||Date.now()-m.date>30*DAY)&&(!q||[m.from,m.email,m.subject,m.snippet].join(' ').toLowerCase().includes(q))).sort((a,b)=>$('#sort').value==='sender'?a.from.localeCompare(b.from):$('#sort').value==='old'?a.date-b.date:b.date-a.date)}
function render(){const inbox=mails.filter(m=>!m.trash),v=visible();$('#total').textContent=inbox.length;$('#cleanable').textContent=inbox.filter(m=>['promo','sub'].includes(m.cat)).length;$('#cleaned').textContent=mails.filter(m=>m.trash).length;$('#nav').innerHTML=[['all','▣','全部邮件',inbox.length],...categories.map(c=>[c.id,c.icon,c.name,inbox.filter(m=>m.cat===c.id).length]),['trash','♧','垃圾箱',mails.filter(m=>m.trash).length]].map(([id,icon,name,n])=>`<button data-nav="${id}" class="${current===id?'active':''}">${icon} &nbsp;&nbsp; ${name}<span>${n}</span></button>`).join('');$('#cards').innerHTML=categories.map(c=>`<button class="card ${current===c.id?'active':''}" style="${style(c)}" data-nav="${c.id}"><span class="card-icon">${c.icon}</span><span class="count">${inbox.filter(m=>m.cat===c.id).length}</span><b>${c.name}</b><small>${c.hint}</small></button>`).join('');$('#list-title').textContent=current==='all'?'全部邮件':current==='trash'?'垃圾箱':categories.find(c=>c.id===current).name;$('#list-count').textContent=v.length+' 封';$('#mails').innerHTML=v.length?v.map(m=>`<div class="mail-row ${m.unread?'unread':''} ${selected.has(m.id)?'selected':''}" data-id="${esc(m.id)}" style="${style(cat(m))}"><input type="checkbox" aria-label="选择 ${esc(m.subject)}" data-check="${esc(m.id)}" ${selected.has(m.id)?'checked':''}><span class="sender-icon">${esc(m.from[0])}</span><div class="sender">${esc(m.from)}<small>${esc(m.email)}</small></div><div class="subject"><b>${esc(m.subject)}</b><small>${esc(m.snippet)}</small></div><span class="category-tag">${cat(m).name}</span><time>${new Date(m.date).toLocaleDateString('zh-CN',{month:'short',day:'numeric'})}</time></div>`).join(''):'<div class="empty">✧<br><br>这里很清爽，暂时没有符合条件的邮件。</div>';$('#select-all').checked=!!v.length&&v.every(m=>selected.has(m.id));$('#select-all').indeterminate=v.some(m=>selected.has(m.id))&&!$('#select-all').checked;$('#selection-label').textContent=selected.size?'已选择 '+selected.size+' 封':'全选当前结果';$('#delete').disabled=busy||!selected.size||(!demo&&!token);$('#delete').hidden=current==='trash';$('#restore').hidden=current!=='trash';$('#restore').disabled=busy||!selected.size||(!demo&&!token);$('#footer-count').textContent=`显示 ${v.length} 封 · ${demo?'演示数据':'已保存的整理记录 · 收件箱最多 1000 封'}`;updateSyncStatus();document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{current=b.dataset.nav;selected.clear();render()});document.querySelectorAll('[data-check]').forEach(b=>{b.onclick=e=>e.stopPropagation();b.onchange=()=>{b.checked?selected.add(b.dataset.check):selected.delete(b.dataset.check);render()}});document.querySelectorAll('.mail-row').forEach(row=>row.onclick=()=>preview(mails.find(m=>m.id===row.dataset.id)));['all','unread','old'].forEach(f=>$('#'+(f==='all'?'all':f)+'-filter').classList.toggle('active',filter===f))}
function toast(msg,action){$('#toast').hidden=false;$('#toast').textContent=msg;if(action){const b=document.createElement('button');b.textContent='撤销';b.onclick=action;$('#toast').append(b)}}function modal(html){$('#dialog-content').innerHTML=html;$('#dialog').showModal()}$('#close-dialog').onclick=()=>$('#dialog').close();$('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog'))$('#dialog').close()});
function preview(m){modal(`<small>${esc(m.from)} &lt;${esc(m.email)}&gt;</small><h2>${esc(m.subject)}</h2><p>${new Date(m.date).toLocaleString('zh-CN')} · ${cat(m).name}</p><div class="body">${esc(m.snippet)}</div><p>${demo?'这是一封演示邮件。':'当前展示邮件摘要。'}</p><label>调整分类 <select id="change-cat">${categories.map(c=>`<option value="${c.id}" ${c.id===m.cat?'selected':''}>${c.name}</option>`).join('')}</select></label>`);$('#change-cat').disabled=busy;$('#change-cat').onchange=e=>{if(busy)return;const updated=mails.map(mail=>mail.id===m.id?{...mail,cat:e.target.value,manualCat:e.target.value}:mail);try{if(!demo)syncEngine.saveEdits(updated);mails=updated;render()}catch(error){e.target.value=m.cat;toast(error.message)}}}
$('#search').oninput=()=>{selected.clear();render()};$('#sort').onchange=render;['all','unread','old'].forEach(f=>$('#'+f+'-filter').onclick=()=>{filter=f;selected.clear();render()});$('#select-all').onchange=e=>{visible().forEach(m=>e.target.checked?selected.add(m.id):selected.delete(m.id));render()};$('#clear-selection').onclick=()=>{selected.clear();render()};document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();$('#search').focus()}});
const SESSION_KEY='mailroom-gmail-session';
const LAST_ACCOUNT_KEY='mailroom-gmail-last-account';
let authorizing=false;
const syncEngine=new MailroomSync.MailSync({storage:{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)},api:(...args)=>api(...args),classify:(...args)=>classify(...args),onProgress:message=>toast(message)});
function localValue(key){try{return localStorage.getItem(key)||''}catch{return ''}}
function savedView(){mails=syncEngine.mails;selected.clear();undo=null;connectedUI();render()}
function saveConnection(){try{localStorage.setItem(SESSION_KEY,JSON.stringify({token,expires,email:syncEngine.email}));if(syncEngine.email)localStorage.setItem(LAST_ACCOUNT_KEY,syncEngine.email);sessionStorage.removeItem(SESSION_KEY)}catch{toast('浏览器未允许保存连接，重新打开时需要授权。')}}
function clearConnection(){try{localStorage.removeItem(SESSION_KEY)}catch{}try{sessionStorage.removeItem(SESSION_KEY)}catch{}}
function requireReconnect(){clearConnection();token='';expires=0;selected.clear();if(!demo)connectedUI();render()}
function connectedUI(){demo=false;$('#mode').textContent=token?'● Gmail 已连接':'● 已保存整理记录';$('#account').textContent=syncEngine.email||'Gmail';$('#connect').textContent=token?'管理连接':'重新连接 Gmail'}
function updateSyncStatus(){const status=$('#sync-status');status.hidden=demo;status.textContent=syncEngine.lastSyncedAt?'上次整理：'+new Date(syncEngine.lastSyncedAt).toLocaleString('zh-CN')+(!token?' · 重新连接后继续同步':' · 仅同步新增和变化'):'首次连接后会保存整理进度';$('#refresh').disabled=busy;$('#refresh').textContent=demo?'↻ 重新整理':token?'↻ 同步新增邮件':'重新连接 Gmail'}
async function restoreConnection(){
  let saved=null;
  try{saved=JSON.parse(localValue(SESSION_KEY)||sessionStorage.getItem(SESSION_KEY)||'null')}catch{clearConnection()}
  syncEngine.selectAccount(localValue(LAST_ACCOUNT_KEY)||saved?.email||'');
  if(syncEngine.hasSnapshot)savedView();
  if(!saved)return;
  if(typeof saved.token!=='string'||!Number.isFinite(saved.expires)||saved.expires<=Date.now()+30000){requireReconnect();if(syncEngine.hasSnapshot)toast('已恢复上次整理记录，重新连接 Gmail 后继续同步。');else toast('Gmail 授权已过期，请重新连接。');return}
  token=saved.token;expires=saved.expires;connectedUI();render();await refresh();
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let readQueue=Promise.resolve(),nextReadAt=0;
function paceRead(){const wait=readQueue.then(async()=>{await pause(Math.max(0,nextReadAt-Date.now()));nextReadAt=Date.now()+250});readQueue=wait.catch(()=>{});return wait}
async function api(path,body){for(let attempt=0;attempt<5;attempt++){if(!token||Date.now()>expires){requireReconnect();throw Error('Gmail 授权已失效，请点击右上角「重新连接 Gmail」重新授权。')}if(!body)await paceRead();if(!token||Date.now()>expires){requireReconnect();throw Error('Gmail 授权已失效，请重新连接 Gmail。')}const r=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(r.ok)return r.status===204?{}:r.json().catch(()=>({}));const d=await r.json().catch(()=>({}));const message=d.error?.message||'请求失败，请稍后重试。';if(r.status===401){requireReconnect();throw Error('Google 已拒绝当前授权，请点击右上角「重新连接 Gmail」重新授权，无需修改 Client ID。')}const limited=r.status===429||r.status===403&&(/per minute|rate.?limit/i.test(message)||(d.error?.errors||[]).some(x=>/rateLimitExceeded|userRateLimitExceeded/.test(x.reason)));if(!body&&limited&&attempt<4){const retry=r.headers.get('Retry-After');const serverWait=retry?(Number.isFinite(Number(retry))?Number(retry)*1000:Date.parse(retry)-Date.now()):0;const ms=Math.max(serverWait||0,Math.min(30000,4000*2**attempt)+Math.random()*1000);nextReadAt=Math.max(nextReadAt,Date.now()+ms);toast('Gmail 暂时限流，约 '+Math.ceil(ms/1000)+' 秒后自动继续读取…');await pause(ms);continue}const error=Error(message);error.status=r.status;throw error}}
async function move(ids,trash,record=true){
  if(busy||!ids.length)return;busy=true;render();
  try{
    if(!demo)await api('messages/batchModify',{ids,addLabelIds:trash?['TRASH']:['INBOX'],removeLabelIds:trash?['INBOX']:['TRASH']});
    const targets=new Set(ids);
    const updated=mails.map(m=>targets.has(m.id)?{...m,trash,labels:[...(m.labels||[]).filter(l=>l!== (trash?'INBOX':'TRASH')&&l!== (trash?'TRASH':'INBOX')),trash?'TRASH':'INBOX']}:m);
    let warning='';
    if(!demo){try{syncEngine.saveEdits(updated)}catch(error){warning='；'+error.message}}
    mails=updated;if(record)undo={ids:[...ids],trash};selected.clear();render();
    toast(`${demo?'演示：':''}${ids.length} 封邮件已${trash?'移入垃圾箱':'恢复'}${warning}`,record?async()=>{if(!undo)return;const u=undo;await move(u.ids,!u.trash,false);undo=null}:null);
  }catch(error){toast(error.message+' 操作结果未确认，请同步检查。')}finally{busy=false;render()}
}
$('#delete').onclick=()=>move([...selected],true);$('#restore').onclick=()=>move([...selected],false);
function classify(subject,from,labels,headers){const s=(subject+' '+from).toLowerCase();if(/账单|发票|收据|付款|机票|工资单|工资条|薪资单|薪酬单|薪水单|receipt|invoice|payment|\bpay[\s-]?slips?\b|\b(?:payroll|salary|earnings)\s+statements?\b/.test(s))return'bill';if(labels.includes('CATEGORY_PROMOTIONS')||/促销|优惠|折扣|特惠|sale|discount|offer|coupon/.test(s))return'promo';if(headers.some(h=>h.name.toLowerCase()==='list-unsubscribe')||/订阅|周刊|精选|newsletter|digest|weekly/.test(s))return'sub';if(labels.includes('CATEGORY_UPDATES')||/提醒|通知|验证|登录|notification|alert|verify|security/.test(s))return'notice';return'personal'}
async function refresh(force=false){
  if(busy)return;
  if(demo){render();toast('演示邮件已重新分类');return}
  if(!token){settings();return}
  busy=true;render();toast(syncEngine.hasSnapshot?'正在检查上次整理后的变化…':'正在读取 Gmail 并分类…');
  try{
    const profile=await api('profile');
    const email=String(profile.emailAddress||'').trim().toLowerCase();
    if(!email)throw Error('无法确认 Gmail 账号，请重新连接。');
    if(syncEngine.email!==email){syncEngine.selectAccount(email);savedView()}
    saveConnection();
    const result=await syncEngine.sync({force:force===true,profile});
    savedView();
    toast(result.full?`已整理 ${mails.filter(m=>!m.trash).length} 封邮件${result.limited?'，已达到 1000 封上限':''}`:result.changed?`已同步 ${result.changed} 封变化邮件，上次分类已保留`:'没有新增或变化的邮件，已保留上次整理结果');
  }catch(error){toast('同步失败：'+error.message+' 当前保留上次数据和整理进度。')}finally{busy=false;render()}
}
$('#refresh').onclick=()=>refresh();$('#rules').onclick=()=>modal('<small>透明、可调整的分类</small><h2>每一封，都有去处。</h2><p>按以下顺序匹配标签与主题关键词：</p><p>① 账单凭证：账单、发票、收据、工资单／工资条、薪资单、Payslip（含 Pay slip）、Payroll statement、invoice、payment<br>② 促销优惠：Gmail 促销标签、优惠、折扣、sale<br>③ 订阅资讯：退订邮件头、周刊、newsletter、digest<br>④ 通知提醒：Gmail 动态标签、提醒、验证、alert<br>⑤ 个人往来：其余邮件</p><p>分类可能有误，清理前请检查。点击邮件可手动调整分类，保存在此设备，下次整理时继续保留。不会自动删除任何邮件。</p>');
function settings(){
  modal(`<small>连接你的收件箱</small><h2>从这里，开始变轻。</h2><p>支持 Gmail。此设备会保存邮件摘要、分类和上次整理时间，下次打开可直接查看，再同步新增和变化的邮件。Google 授权过期后需点击重新连接，整理进度会保留。</p>${syncEngine.hasSnapshot?`<p>已保存：${esc(syncEngine.email)}<br>上次整理：${new Date(syncEngine.lastSyncedAt).toLocaleString('zh-CN')}</p>`:''}<p>首次使用需在 Google Cloud 启用 Gmail API，创建「Web 应用」OAuth 客户端，将以下地址加入「已获授权的 JavaScript 来源」：</p><code>${esc(location.origin)}</code><input id="client-id" type="text" aria-label="Google OAuth Client ID" placeholder="粘贴 Google OAuth Client ID" value="${esc(localValue('mailroom-client-id'))}"><small>只需 Client ID，无需填写密码或 Client Secret。测试状态的应用需添加测试用户。</small><button id="authorize" class="primary">${syncEngine.hasSnapshot?'重新连接并同步新增邮件 →':'使用 Google 授权连接 →'}</button><button id="demo-reset">${demo?'重置演示':'断开并返回演示（保留整理记录）'}</button>${syncEngine.hasSnapshot?'<button id="rescan">重新核对最近 1000 封</button><button id="forget-cache">清除此设备的邮箱记录</button>':''}<p id="auth-error" role="alert"></p><p>整理记录仅保存在此浏览器，清除浏览器数据或换设备后需重新整理。<a href="https://developers.google.com/workspace/gmail/api/quickstart/js" target="_blank" rel="noopener">Google 配置说明 ↗</a></p>`);
  $('#authorize').onclick=()=>{
    if(busy||authorizing)return;
    const id=$('#client-id').value.trim();
    if(!id.endsWith('.apps.googleusercontent.com')){$('#auth-error').textContent='请输入有效的 Google OAuth Client ID。';return}
    if(!window.google?.accounts?.oauth2){$('#auth-error').textContent='Google 授权组件尚未加载，请检查网络后重试。';return}
    try{localStorage.setItem('mailroom-client-id',id)}catch{}
    authorizing=true;$('#authorize').disabled=true;
    const client=google.accounts.oauth2.initTokenClient({client_id:id,scope:'https://www.googleapis.com/auth/gmail.modify',...(syncEngine.email?{hint:syncEngine.email}:{}),error_callback:error=>{authorizing=false;$('#authorize').disabled=false;$('#auth-error').textContent='授权窗口未完成，请重试：'+error.type},callback:async response=>{
      authorizing=false;$('#authorize').disabled=false;
      if(response.error){$('#auth-error').textContent='授权失败：'+response.error;return}
      if(busy){$('#auth-error').textContent='请等待当前同步完成后重新连接。';return}
      if(typeof response.access_token!=='string'||!Number.isFinite(Number(response.expires_in))||Number(response.expires_in)<=0){$('#auth-error').textContent='Google 未返回有效授权，请重试。';return}
      token=response.access_token;expires=Date.now()+Number(response.expires_in)*1000;
      demo=false;selected.clear();undo=null;current='all';connectedUI();$('#dialog').close();render();await refresh();
    }});
    client.requestAccessToken({prompt:''});
  };
  $('#demo-reset').onclick=()=>{
    if(busy||authorizing){$('#auth-error').textContent='请等待当前操作或授权完成。';return}
    if(token&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(token,()=>{});
    clearConnection();token='';expires=0;demo=true;current='all';$('#search').value='';filter='all';$('#mode').textContent='● 演示模式';$('#account').textContent='演示邮箱 · 本地体验';$('#connect').textContent='＋ 连接 Gmail';$('#dialog').close();reset();toast('已返回演示，邮箱整理记录保留在此设备。');
  };
  if($('#rescan'))$('#rescan').onclick=()=>{if(busy)return;$('#dialog').close();if(!token){toast('请先重新连接 Gmail。');settings();return}refresh(true)};
  if($('#forget-cache'))$('#forget-cache').onclick=()=>{
    if(busy||authorizing)return;
    try{syncEngine.forgetAccount();localStorage.removeItem(LAST_ACCOUNT_KEY)}catch(error){$('#auth-error').textContent='浏览器未允许清除记录，请检查设置后重试。';return}
    clearConnection();token='';expires=0;demo=true;current='all';filter='all';$('#search').value='';$('#mode').textContent='● 演示模式';$('#account').textContent='演示邮箱 · 本地体验';$('#connect').textContent='＋ 连接 Gmail';$('#dialog').close();reset();toast('已清除此设备的邮箱记录。');
  };
}
$('#connect').onclick=()=>!busy&&settings();$('#settings').onclick=()=>!busy&&settings();reset();restoreConnection();
