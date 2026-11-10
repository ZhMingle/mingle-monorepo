'use strict';

const $ = selector => document.querySelector(selector);
const DAY = 86400000;
const categories = [
  { id: 'promo', name: '促销优惠', icon: '◇', color: '#a17b45', tint: '#f7efe2', hint: '好物很多，按需留下' },
  { id: 'sub', name: '订阅资讯', icon: '▤', color: '#73835f', tint: '#eef2e6', hint: '让阅读回归你的节奏' },
  { id: 'notice', name: '通知提醒', icon: '♧', color: '#668493', tint: '#eaf1f4', hint: '及时知晓，适时清理' },
  { id: 'bill', name: '账单凭证', icon: '▧', color: '#90769f', tint: '#f1ecf5', hint: '工资与账单，妥善保留' },
  { id: 'personal', name: '个人往来', icon: '♙', color: '#b47e6d', tint: '#f8eee9', hint: '重要的人，值得关注' },
];
let token = '';

let state = { connected: false, email: '', provider: '', limit: 500, total: 0, mails: [], canTrash: false, canUndo: false };
let providers = [];
let demo = false;
let busy = false;
let uncertain = false;
let current = 'all';
let filter = 'all';
let selected = new Set();
let demoUndo = null;
let toastTimer;
let workMessage = '';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const category = mail => categories.find(item => item.id === mail.cat) || categories[4];
const categoryStyle = item => `--color:${item.color};--tint:${item.tint}`;
const dateLabel = (value, full = false) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? (full ? date.toLocaleString('zh-CN') : date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })) : '日期未知';
};

async function api(path, body) {
  if (!token) throw new Error('连接会话尚未准备好，请刷新网页后再试。');
  const response = await fetch('/api/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: 'Bearer ' + token, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    cache: 'no-store',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let result;
  try { result = await response.json(); }
  catch { throw new Error('服务暂时没有返回有效结果，请稍后刷新网页。'); }
  if (!response.ok) throw new Error(result.message || result.error || (response.status === 401 ? '会话已失效，请刷新网页后重新连接。' : '操作未完成，请稍后再试。'));
  return result;
}

function applyState(next) {
  if (!next || !Array.isArray(next.mails)) throw new Error('收到的邮件状态不完整，请重新整理。');
  state = next;
  const validIds = new Set(state.mails.map(mail => mail.id));
  selected = new Set([...selected].filter(id => validIds.has(id)));
  $('#limit').value = String(state.limit || 500);
}

function visible() {
  const query = $('#search').value.trim().toLowerCase();
  return state.mails.filter(mail =>
    (current === 'trash' ? mail.trash : !mail.trash) &&
    (current === 'all' || current === 'trash' || mail.cat === current) &&
    (filter !== 'unread' || mail.unread) &&
    (filter !== 'old' || Date.now() - mail.date > 30 * DAY) &&
    (!query || [mail.from, mail.email, mail.subject, mail.snippet].join(' ').toLowerCase().includes(query))
  ).sort((a, b) => $('#sort').value === 'sender'
    ? String(a.from || '').localeCompare(String(b.from || ''), 'zh-CN')
    : $('#sort').value === 'old' ? a.date - b.date : b.date - a.date);
}

function render() {
  const inbox = state.mails.filter(mail => !mail.trash);
  const trash = state.mails.filter(mail => mail.trash);
  const shown = visible();
  const canUse = demo || state.connected;
  const canMove = canUse && (demo || state.canTrash) && !uncertain;
  $('#account').textContent = demo ? '演示邮箱 · 不触及真实邮件' : state.connected ? state.email : '连接你自己的邮箱';
  $('#connection-dot').classList.toggle('offline', !state.connected && !demo);
  $('#mode').textContent = demo ? '● 演示模式' : state.connected ? '● 邮箱已连接' : '● 尚未连接';
  $('#connect').textContent = state.connected ? '管理连接' : '＋ 连接邮箱';
  $('#connect').disabled = busy || !token;
  $('#settings').disabled = busy || !token;
  $('#refresh').disabled = busy || !canUse;
  $('#limit').disabled = busy;
  $('#total').textContent = inbox.length.toLocaleString();
  $('#cleanable').textContent = inbox.filter(mail => ['promo', 'sub'].includes(mail.cat)).length.toLocaleString();
  $('#cleaned').textContent = trash.length.toLocaleString();
  $('#loaded-scope').textContent = demo ? '演示数据 · 体验分类与清理' : state.connected ? `最近 ${state.limit || 500} 封范围 · 收件箱共 ${Number(state.total || 0).toLocaleString()} 封` : '先连接邮箱，再开始整理';
  $('#nav').innerHTML = [
    ['all', '▣', '全部邮件', inbox.length],
    ...categories.map(item => [item.id, item.icon, item.name, inbox.filter(mail => mail.cat === item.id).length]),
    ['trash', '♧', '本次垃圾箱', trash.length],
  ].map(([id, icon, name, count]) => `<button data-nav="${id}" class="${current === id ? 'active' : ''}" aria-pressed="${current === id}">${icon} &nbsp;&nbsp; ${name}<span>${count}</span></button>`).join('');
  $('#cards').innerHTML = categories.map(item => `<button class="card ${current === item.id ? 'active' : ''}" style="${categoryStyle(item)}" data-nav="${item.id}" aria-pressed="${current === item.id}"><span class="card-icon">${item.icon}</span><span class="count">${inbox.filter(mail => mail.cat === item.id).length}</span><b>${item.name}</b><small>${item.hint}</small></button>`).join('');
  $('#list-title').textContent = current === 'all' ? '全部邮件' : current === 'trash' ? '本次垃圾箱' : categories.find(item => item.id === current)?.name || '全部邮件';
  $('#list-count').textContent = shown.length + ' 封';
  $('#mails').innerHTML = shown.length ? shown.map(mail => `<div class="mail-row ${mail.unread ? 'unread' : ''} ${selected.has(mail.id) ? 'selected' : ''}" data-id="${esc(mail.id)}" style="${categoryStyle(category(mail))}"><input type="checkbox" aria-label="选择 ${esc(mail.subject)}" data-check="${esc(mail.id)}" ${selected.has(mail.id) ? 'checked' : ''} ${busy ? 'disabled' : ''}><span class="sender-icon" aria-hidden="true">${esc(String(mail.from || mail.email || '?').slice(0, 1))}</span><div class="sender">${esc(mail.from || mail.email)}<small>${esc(mail.email)}</small></div><button class="subject" data-preview="${esc(mail.id)}" aria-label="查看 ${esc(mail.subject)}"><b>${esc(mail.subject || '（无主题）')}</b><small>${esc(mail.snippet || mail.email || '点击查看邮件信息')}</small></button><span class="category-tag">${category(mail).name}</span><time>${dateLabel(mail.date)}</time></div>`).join('') : `<div class="empty"><span class="empty-mark">✧</span><br><br>${!canUse ? '连接你的邮箱，从一封邮件开始。' : current === 'trash' ? '这里显示本次连接移入垃圾箱的邮件。' : '这里很清爽，暂时没有符合条件的邮件。'}${!canUse && token ? '<br><button id="empty-connect" class="primary">连接邮箱 →</button>' : ''}</div>`;
  $('#select-all').checked = shown.length > 0 && shown.every(mail => selected.has(mail.id));
  $('#select-all').indeterminate = shown.some(mail => selected.has(mail.id)) && !$('#select-all').checked;
  $('#select-all').disabled = busy || !shown.length;
  $('#selection-label').textContent = selected.size ? `已选择 ${selected.size} 封` : '全选当前结果';
  $('#delete').disabled = busy || !selected.size || !canMove;
  $('#delete').hidden = current === 'trash';
  $('#restore').hidden = current !== 'trash';
  $('#restore').disabled = busy || !selected.size || !canMove;
  $('#undo').disabled = busy || uncertain || !(demo ? demoUndo : state.canUndo);
  $('#clear-selection').disabled = busy || !selected.size;
  $('#footer-count').textContent = `显示 ${shown.length} 封 · ${demo ? '本地演示数据' : state.connected ? `最近 ${state.limit || 500} 封读取范围` : '尚未连接邮箱'}`;
  $('#trash-note').textContent = current === 'trash' ? '仅显示本次连接移入的邮件，断开后此列表清空。' : '只在你选择后移动邮件。';
  const warning = !token ? '正在建立独立会话；如果一直没有响应，请刷新网页。' : uncertain ? '上次操作结果未确认。请先点击「重新整理」核对邮件，再继续操作。' : state.connected && !state.canTrash ? (state.trashUnavailableReason || '邮箱暂不支持安全地移动到垃圾箱；可以继续查看与分类。') : '';
  $('#connection-warning').hidden = !warning;
  $('#connection-warning').textContent = warning;
  $('#work-status').hidden = !busy;
  $('#work-status').textContent = workMessage;
  document.body.classList.toggle('is-busy', busy);
  $('#mails').setAttribute('aria-busy', String(busy));
  document.querySelectorAll('[data-nav]').forEach(button => {
    button.disabled = busy;
    button.onclick = () => { current = button.dataset.nav; selected.clear(); render(); };
  });
  document.querySelectorAll('[data-check]').forEach(input => {
    input.onclick = event => event.stopPropagation();
    input.onchange = () => { input.checked ? selected.add(input.dataset.check) : selected.delete(input.dataset.check); render(); };
  });
  document.querySelectorAll('[data-preview]').forEach(button => button.onclick = () => preview(state.mails.find(mail => mail.id === button.dataset.preview)));
  document.querySelectorAll('.mail-row').forEach(row => row.onclick = event => { if (!event.target.closest('input,button')) preview(state.mails.find(mail => mail.id === row.dataset.id)); });
  if ($('#empty-connect')) $('#empty-connect').onclick = settings;
  ['all', 'unread', 'old'].forEach(value => $('#' + value + '-filter').classList.toggle('active', filter === value));
  if ($('#dialog').open) {
    $('#close-dialog').disabled = busy;
    $('#dialog-content').querySelectorAll('input,select,button').forEach(control => control.disabled = busy);
  }
}

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').hidden = false;
  $('#toast').textContent = message;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 10000);
}

function modal(html) {
  $('#dialog-content').innerHTML = html;
  if (!$('#dialog').open) $('#dialog').showModal();
}

async function runTask(message, task, mutation = false) {
  if (busy) return false;
  busy = true;
  workMessage = message;
  render();
  try {
    await task();
    return true;
  } catch (error) {
    if (mutation) {
      uncertain = true;
      try { applyState(await api('state')); } catch { /* Keep the last verified snapshot. */ }
    }
    toast((error.message || '操作没有完成。') + (mutation ? ' 操作结果未确认，请重新整理核对。' : ''));
    const authError = $('#auth-error');
    if (authError) authError.textContent = error.message || '连接没有完成，请检查后重试。';
    return false;
  } finally {
    busy = false;
    workMessage = '';
    render();
  }
}

async function refresh() {
  if (demo) { toast('演示邮件已重新整理。'); render(); return; }
  if (!state.connected) return settings();
  await runTask('正在读取并分类邮件，请稍候…', async () => {
    applyState(await api('refresh', { limit: Number($('#limit').value) }));
    uncertain = false;
    selected.clear();
    toast('邮件已重新整理。');
  });
}

async function move(trash) {
  if (!selected.size || busy || uncertain) return;
  const ids = [...selected];
  const action = trash ? '移入垃圾箱' : '恢复到收件箱';
  if (ids.length > 1 && !window.confirm(`将所选 ${ids.length} 封邮件${action}？${demo ? '（当前为演示模式）' : ''}`)) return;
  if (demo) {
    demoUndo = state.mails.filter(mail => ids.includes(mail.id)).map(mail => ({ id: mail.id, trash: mail.trash }));
    state.mails.forEach(mail => { if (ids.includes(mail.id)) mail.trash = trash; });
    selected.clear();
    render();
    toast(`演示：${ids.length} 封邮件已${action}。`);
    return;
  }
  await runTask(`正在${action}…`, async () => {
    applyState(await api('move', { ids, trash, operationId: crypto.randomUUID() }));
    selected.clear();
    toast(`${ids.length} 封邮件已${action}。`);
  }, true);
}

async function undo() {
  if (busy || uncertain) return;
  if (demo) {
    if (!demoUndo) return;
    for (const previous of demoUndo) {
      const mail = state.mails.find(item => item.id === previous.id);
      if (mail) mail.trash = previous.trash;
    }
    demoUndo = null;
    selected.clear();
    render();
    toast('演示：上次移动已撤销。');
    return;
  }
  await runTask('正在撤销上次移动…', async () => {
    applyState(await api('undo', { operationId: crypto.randomUUID() }));
    selected.clear();
    toast('上次移动已撤销。');
  }, true);
}

function preview(mail) {
  if (!mail || busy) return;
  modal(`<small>${esc(mail.from)} &lt;${esc(mail.email)}&gt;</small><h2 id="dialog-title" class="preview-title">${esc(mail.subject || '（无主题）')}</h2><p>${dateLabel(mail.date, true)} · ${category(mail).name}${mail.unread ? ' · 未读' : ''}</p>${mail.snippet ? `<div class="body">${esc(mail.snippet)}</div>` : ''}<div class="info-panel">${demo ? '这是一封演示邮件，不会触及真实邮箱。' : '这里只展示邮件信息。原文及附件请在邮箱中查看，查看这里不会将邮件标记为已读。'}</div><label class="field-label" for="change-cat">调整分类</label><select id="change-cat" class="field-select">${categories.map(item => `<option value="${item.id}" ${item.id === mail.cat ? 'selected' : ''}>${item.name}</option>`).join('')}</select><small>手动分类在本次连接期间保留。</small>`);
  $('#change-cat').onchange = async event => {
    const value = event.target.value;
    if (demo) { mail.cat = value; render(); return; }
    const previous = mail.cat;
    const success = await runTask('正在保存分类…', async () => {
      applyState(await api('classify', { id: mail.id, category: value }));
      selected.clear();
      toast('本次连接的分类已更新。');
    });
    if (!success && $('#change-cat')) $('#change-cat').value = previous;
  };
}

function providerHelp() {
  const provider = providers.find(item => item.id === $('#provider')?.value);
  if (!provider) return;
  const custom = provider.id === 'custom';
  $('#custom-fields').hidden = !custom;
  $('#imap-host').required = custom;
  $('#provider-tip').textContent = provider.tip || '在邮箱设置中开启 IMAP，并使用邮箱要求的授权码或应用专用密码。';
  const help = $('#provider-help');
  const safeLink = /^https:\/\//i.test(provider.help || '');
  help.hidden = !safeLink;
  help.href = safeLink ? provider.help : '#';
  $('#imap-host').value = custom ? '' : (provider.host || '');
  $('#imap-port').value = provider.port || 993;
  $('#imap-security').value = 'ssl';
}

function settings() {
  if (busy || !token) return;
  if (state.connected && !demo) {
    const provider = providers.find(item => item.id === state.provider);
    modal(`<small>只连接你自己的邮箱</small><h2 id="dialog-title">你的邮箱，已连接。</h2><div class="connected-card"><span class="avatar">✓</span><div><b>${esc(state.email)}</b><small>${esc(provider?.name || state.provider)} · ${esc(state.trashFolder || '未发现可用垃圾箱')}</small></div></div><p>服务通过加密连接访问邮箱；授权码和邮件信息仅用于本次会话，不写入数据库。断开连接或 20 分钟无操作后清除。</p><p>本次垃圾箱与撤销记录也会在断开或会话结束时清空；已经移动的邮件仍保留在邮箱对应文件夹中。</p><button id="disconnect" class="secondary">断开这个邮箱</button><p id="auth-error" class="error" role="alert"></p>`);
    $('#disconnect').onclick = async () => {
      const success = await runTask('正在断开邮箱…', async () => {
        applyState(await api('disconnect', {}));
        demo = false;
        uncertain = false;
        current = 'all';
        filter = 'all';
        selected.clear();
        $('#search').value = '';
        toast('邮箱已断开。');
      });
      if (success) settings();
    };
    return;
  }
  modal(`<small>从这里，开始变轻。</small><h2 id="dialog-title">连接你自己的邮箱</h2><p>选好邮箱，输入邮箱地址和专用授权码即可。无需配置开发者账号，也不用安装其他软件。</p><form id="connection-form"><label class="field-label" for="provider">邮箱类型</label><select id="provider" class="field-select" required>${providers.map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('')}</select><div class="provider-guide"><p id="provider-tip"></p><a id="provider-help" href="#" target="_blank" rel="noopener noreferrer">查看官方连接说明 ↗</a></div><label class="field-label" for="mail-address">邮箱地址</label><input id="mail-address" name="username" type="email" autocomplete="username" placeholder="例如：123456@qq.com" required maxlength="254"><label class="field-label" for="mail-password">授权码／应用专用密码</label><input id="mail-password" name="password" type="password" autocomplete="off" placeholder="输入邮箱生成的专用授权码" required maxlength="512"><div id="custom-fields" hidden><label class="field-label" for="imap-host">IMAP 服务器</label><input id="imap-host" type="text" placeholder="例如：imap.example.com" autocomplete="off" maxlength="253"><div class="form-row"><div><label class="field-label" for="imap-port">端口</label><input id="imap-port" type="number" min="1" max="65535" value="993" required></div><div><label class="field-label" for="imap-security">连接加密</label><select id="imap-security" class="field-select"><option value="ssl">SSL/TLS</option><option value="starttls">STARTTLS</option></select></div></div></div><small class="credential-note">连接时授权码会通过 HTTPS 发送到拾邮服务器，仅用于本次会话。请使用专门为此工具生成的授权码，使用完毕后主动断开。</small><p id="auth-error" class="error" role="alert"></p><div class="dialog-actions"><button id="authorize" type="submit" class="primary">连接并整理邮件 →</button><button id="try-demo" type="button" class="text-button">先体验演示</button></div></form>`);
  providerHelp();
  $('#provider').onchange = providerHelp;
  $('#try-demo').onclick = startDemo;
  $('#connection-form').onsubmit = async event => {
    event.preventDefault();
    if (busy) return;
    $('#auth-error').textContent = '';
    const provider = $('#provider').value;
    const passwordInput = $('#mail-password');
    const body = {
      provider,
      email: $('#mail-address').value.trim(),
      password: passwordInput.value,
      limit: Number($('#limit').value),
      ...(provider === 'custom' ? { host: $('#imap-host').value.trim(), port: Number($('#imap-port').value), security: $('#imap-security').value } : {}),
    };
    const success = await runTask('正在连接邮箱并读取最近的邮件，首次连接可能需要一点时间…', async () => {
      applyState(await api('connect', body));
      demo = false;
      demoUndo = null;
      uncertain = false;
      current = 'all';
      filter = 'all';
      selected.clear();
      $('#search').value = '';
      toast('邮箱已连接，邮件已按规则分类。');
    });
    passwordInput.value = '';
    body.password = '';
    if (success) $('#dialog').close();
  };
}

function startDemo() {
  if (busy || state.connected && !demo) return;
  const seeds = [
    ['MUJI 无印良品', 'news@muji.com', '会员专属好物 · 精选 8 折优惠', 'promo'],
    ['少数派', 'weekly@sspai.com', '一周精选：数字生活的另一种可能', 'sub'],
    ['GitHub', 'notifications@github.com', '你的 Pull Request 已合并', 'notice'],
    ['Apple', 'receipt@apple.com', '你的 Apple 收据', 'bill'],
    ['林小满', 'xiaoman@example.com', '周末去海边走走？', 'personal'],
    ['Xero', 'noreply@post.xero.com', 'Payslip for May 2026', 'bill'],
    ['UNIQLO 优衣库', 'news@uniqlo.com', '秋冬新品 · 会员限时折扣', 'promo'],
    ['Notion', 'news@makenotion.com', '本周 newsletter：打造自己的知识花园', 'sub'],
    ['Google', 'security@google.com', '账号安全提醒：新设备登录', 'notice'],
    ['陈一舟', 'yizhou@example.com', 'Re: 下周的设计讨论', 'personal'],
  ];
  demo = true;
  uncertain = false;
  demoUndo = null;
  current = 'all';
  filter = 'all';
  selected.clear();
  $('#search').value = '';
  state = { connected: false, email: '', provider: 'demo', limit: 500, total: seeds.length, canTrash: true, canUndo: false, mails: seeds.map(([from, email, subject, cat], index) => ({ id: 'demo-' + index, from, email, subject, snippet: '这是一封演示邮件，可以放心体验分类、清理和撤销。', cat, date: Date.now() - index * 6 * DAY, unread: index % 3 !== 1, trash: false })) };
  $('#dialog').close();
  render();
  toast('已进入演示模式，不会读取或修改真实邮箱。');
}

$('#close-dialog').onclick = () => { if (!busy) $('#dialog').close(); };
$('#dialog').addEventListener('cancel', event => { if (busy) event.preventDefault(); });
$('#dialog').addEventListener('click', event => { if (event.target === $('#dialog') && !busy) $('#dialog').close(); });
$('#search').oninput = () => { selected.clear(); render(); };
$('#sort').onchange = () => { selected.clear(); render(); };
$('#limit').onchange = async () => { selected.clear(); if (demo || state.connected) await refresh(); };
for (const value of ['all', 'unread', 'old']) $('#' + value + '-filter').onclick = () => { filter = value; selected.clear(); render(); };
$('#select-all').onchange = event => { for (const mail of visible()) event.target.checked ? selected.add(mail.id) : selected.delete(mail.id); render(); };
$('#clear-selection').onclick = () => { selected.clear(); render(); };
$('#delete').onclick = () => move(true);
$('#restore').onclick = () => move(false);
$('#undo').onclick = undo;
$('#refresh').onclick = refresh;
$('#connect').onclick = settings;
$('#settings').onclick = settings;
$('#rules').onclick = () => modal('<small>透明、可调整的分类</small><h2 id="dialog-title">每一封，都有去处。</h2><p>按以下顺序匹配邮件主题、发件人与订阅信息：</p><ol class="rules-list"><li><b>账单凭证</b>：账单、发票、收据、工资单、工资条、Payslip、Pay slip、Payroll statement、invoice、payment。</li><li><b>促销优惠</b>：优惠、折扣、促销、sale、discount、coupon。</li><li><b>订阅资讯</b>：退订邮件头、周刊、newsletter、digest。</li><li><b>通知提醒</b>：提醒、通知、验证、登录、notification、alert。</li><li><b>个人往来</b>：其余邮件。</li></ol><p>分类可以手动调整。规则只帮助整理，不会自动删除邮件；清理前请检查所选内容。</p>');
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#search').focus(); } });

async function initialize() {
  render();
  await runTask('正在准备你的邮件空间…', async () => {
    if (location.protocol !== 'https:' && !['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)) throw new Error('请使用 HTTPS 地址打开拾邮，再连接邮箱。');
    const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.token || !Array.isArray(result.providers)) throw new Error(result.message || '邮件空间暂时无法打开，请稍后重试。');
    token = result.token;
    providers = result.providers;
    applyState(result.state);
  });
  if (!state.connected && providers.length) settings();
}
initialize();
