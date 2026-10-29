// Browser-local note interpretation. No remote AI or network request is used.
state.recipeNotes ||= [];
state.recipeVersions ||= {};
const originalRecipes = structuredClone(recipes);
function recipeVersion(id) {
  return (state.recipeVersions[id] || []).filter(v => !v.undone).at(-1);
}
function refreshPersonalRecipe(id) {
  recipes[id] = structuredClone(recipeVersion(id)?.recipe || originalRecipes[id]);
}
Object.keys(state.recipeVersions).forEach(id => refreshPersonalRecipe(Number(id)));

function interpretRecipeNote(id, text) {
  const next = structuredClone(recipes[id]);
  const changes = [];
  function addStep(step, at = next.steps.length) {
    if (!next.steps.includes(step)) next.steps.splice(at, 0, step);
  }
  // Only act on the noodle technique in the noodle recipe itself.
  if (id === 3 && /盐/.test(text) && /溶|融|化/.test(text) && /忘|先|提醒|下次/.test(text)) {
    const before = next.steps[0];
    next.steps[0] = '和面前先检查：把配方中的盐完全溶于称好的水，再逐渐加入面粉。不要把盐水这一步漏掉。';
    if (before !== next.steps[0]) changes.push('和面第一步增加“先溶盐、再加面粉”的检查提醒。');
  }
  if (id === 3 && /折|叠/.test(text) && /厚|粘|黏/.test(text)) {
    const step = '下次尝试改善折痕：面片先擀到厚薄均匀，层间撒薄薄的干面粉，松松折叠，不压实折边；切好及时抖开。若仍有厚折痕，可改切短段，减少折叠后再切。';
    if (!next.steps.includes(step)) {
      addStep(step, Math.min(2, next.steps.length));
      changes.push('切面前加入折痕改善提示；这是下次试验建议，尚未验证原因。');
    }
  }
  if (/炒面/.test(text) && /老抽/.test(text) && /白糖|糖/.test(text) && /好吃|喜欢|不错|好香/.test(text) && !/不好吃|不喜欢|不太好吃/.test(text)) {
    const step = '你喜欢的吃法：手工面煮熟、沥水后炒面，加入老抽和白糖。上次只记了“加一点”，两种调料用量待下次称重，尝味后再补。';
    if (!next.steps.includes(step)) {
      addStep(step);
      next.variations ||= [];
      next.variations.push({ name: '老抽白糖炒面', seasonings: '老抽：待称重；白糖：待称重', note: '上次做过，觉得好吃。' });
      changes.push('保留“老抽＋白糖炒面”的喜欢吃法，两种用量标为待称重。');
    }
  }
  // An explicit instruction is needed: observations such as “盐放了 3g” do not overwrite a recipe.
  const command = /(生抽|老抽|蚝油|白糖|糖|盐|食用油)(?:的用量)?\s*(?:改为|改成|调整为|调整到|下次用|下次放|下次加|用量改为)\s*(\d+(?:\.\d+)?)\s*(?:g|克)/gi;
  for (const match of text.matchAll(command)) {
    const amount = Number(match[2]);
    if (!Number.isFinite(amount) || amount < 0 || amount > 500) continue;
    const name = match[1];
    const index = next.ingredients.findIndex(([n]) => n === name || (name === '白糖' && n.startsWith('糖')) || (name === '糖' && n.startsWith('糖')));
    if (index < 0 || next.ingredients[index][1] === amount) continue;
    const old = next.ingredients[index][1];
    next.ingredients[index][1] = amount;
    // Remove stale literal amounts from steps when the ingredient quantity changes.
    const aliases = name === '白糖' || name === '糖' ? ['白糖', '糖'] : [name];
    next.steps = next.steps.map(step => {
      for (const alias of aliases) {
        step = step.replace(new RegExp('(\\d+(?:\\.\\d+)?)\\s*(?:g|克)\\s*' + alias, 'g'), '配方量的' + alias);
        step = step.replace(new RegExp(alias + '先称好，总共\\s*\\d+(?:\\.\\d+)?\\s*(?:g|克)', 'g'), alias + '先按配方称好');
      }
      return step;
    });
    changes.push(`${next.ingredients[index][0]}由 ${old}g 改为 ${amount}g（按你的明确备注）。`);
  }
  return { recipe: next, changes };
}

function applyRecipeNote(id, text, source = '备注', persist = true) {
  text = String(text).trim();
  if (!text) return null;
  const result = interpretRecipeNote(id, text);
  const key = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  const entry = { key, id, text, source, date: new Date().toLocaleString('zh-CN'), changes: result.changes };
  state.recipeNotes.unshift(entry);
  if (result.changes.length) {
    state.recipeVersions[id] ||= [];
    state.recipeVersions[id].push({ key, recipe: result.recipe, changes: result.changes, undone: false });
    refreshPersonalRecipe(id);
  }
  if (persist) save();
  return entry;
}

function undoRecipeNote(key) {
  const entry = state.recipeNotes.find(n => n.key === key);
  if (!entry) return;
  const latest = recipeVersion(entry.id);
  if (!latest || latest.key !== key) return toast('请先撤销较新的修改');
  latest.undone = true;
  entry.undone = true;
  refreshPersonalRecipe(entry.id);
  save();
  render();
  openRecipe(entry.id);
  toast('已恢复到上一个配方，原备注保留');
}

function personalNotesHtml(id) {
  const notes = state.recipeNotes.filter(n => n.id === id);
  const current = recipeVersion(id);
  return `<section style="border-top:1px solid var(--line);margin-top:24px;padding-top:20px">
    <div class="section-head"><h3>让菜谱记住你的经验</h3><button class="btn ghost" onclick="noteEditor(${id})">＋ 写备注</button></div>
    <p class="muted">常见备注会自动补进步骤；明确写“盐改成 1g”可修改克数。其他内容先留为提醒。支持范围有限，暂未接入通用 AI。</p>
    ${notes.length ? notes.map(n => `<div class="note"><div class="section-head"><b>${n.undone ? '已撤销修改' : n.changes.length ? '已更新配方' : '下次提醒 · 未改配方'}</b><span>${esc(n.date)}</span></div>
    <p style="white-space:pre-wrap">${esc(n.text)}</p>
    ${n.changes.length ? `<ul>${n.changes.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : '<p>没有识别到可明确执行的修改，原文会在下次打开时提醒你。</p>'}
    ${!n.undone && current?.key === n.key ? `<button class="btn ghost" onclick="undoRecipeNote('${n.key}')">撤销这次修改</button>` : ''}</div>`).join('') : '<p class="muted">做完发现了什么？记下来，下次不用重新摸索。</p>'}
  </section>`;
}

const baseOpenRecipe = openRecipe;
openRecipe = function(id) {
  baseOpenRecipe(id);
  $('#ingredients').insertAdjacentHTML('afterend', `<div style="margin:16px 0"><button class="btn" id="save-ingredients" onclick="saveIngredientRecipe(${id})" disabled>保存为我的配方</button><p class="muted" id="ingredient-save-status" role="status" aria-live="polite">修改克数后点保存，下次打开会沿用。当前显示用量将作为新的原配方。</p></div>`);
  $('#ingredients').oninput = markIngredientChanges;
  $('#scale').addEventListener('change', markIngredientChanges);
  $('#modal').insertAdjacentHTML('beforeend', personalNotesHtml(id));
};

function markIngredientChanges() {
  $('#save-ingredients').disabled = false;
  $('#ingredient-save-status').textContent = '用量已修改，尚未保存。保存后，当前显示克数会成为默认用量。';
}

function saveIngredientRecipe(id) {
  const inputs = [...document.querySelectorAll('[data-ingredient]')];
  const current = recipes[id];
  if (inputs.length !== current.ingredients.length) return;
  const values = inputs.map(input => Number(input.value));
  const invalid = inputs.findIndex((input, i) => input.value.trim() === '' || !Number.isFinite(values[i]) || values[i] < 0 || !input.checkValidity());
  if (invalid !== -1) {
    $('#ingredient-save-status').textContent = '请填写有效的非负克数，支持一位小数；不使用的调料可以填 0。';
    inputs[invalid].focus();
    return;
  }
  const changes = current.ingredients.flatMap(([name, grams], i) => grams === values[i] ? [] : [`${name}由 ${grams}g 改为 ${values[i]}g。`]);
  if (!changes.length) {
    $('#ingredient-save-status').textContent = '用量与已保存配方一致。';
    $('#save-ingredients').disabled = true;
    return;
  }
  const next = structuredClone(current);
  next.ingredients = current.ingredients.map(([name], i) => [name, values[i]]);
  // Existing hard-coded instruction weights must not contradict the saved ingredient table.
  current.ingredients.forEach(([name, old], i) => {
    if (old === values[i]) return;
    const alias = name.split('（')[0];
    next.steps = next.steps.map(step => step
      .replace(new RegExp('\\d+(?:\\.\\d+)?\\s*(?:g|克)\\s*' + alias, 'g'), '配方量的' + alias)
      .replace(new RegExp(alias + '先称好，总共\\s*\\d+(?:\\.\\d+)?\\s*(?:g|克)', 'g'), alias + '先按配方称好'));
  });
  const key = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  const pending = structuredClone(state);
  pending.recipeNotes.unshift({key, id, text:'直接修改并保存食材克数。', source:'手动保存配方', date:new Date().toLocaleString('zh-CN'), changes});
  pending.recipeVersions[id] ||= [];
  pending.recipeVersions[id].push({key, recipe:next, changes, undone:false});
  // Persist first: storage failures must not display a successful save or lose the edited fields.
  try {
    localStorage.setItem('easy-meals-v1', JSON.stringify(pending));
  } catch {
    $('#ingredient-save-status').textContent = '未能保存到此浏览器。你的输入还在，请检查浏览器存储后重试。';
    return;
  }
  state = pending;
  refreshPersonalRecipe(id);
  $('#scale').value = '1';
  $('#save-ingredients').disabled = true;
  $('#ingredient-save-status').textContent = '已保存为我的配方，关闭或刷新后仍会保留；倍数已重置为原配方用量。';
  render();
  toast('配方已保存，下次打开沿用这些克数');
}

function noteEditor(id) {
  show(`<h2>${esc(recipes[id].name)} · 写点经验</h2><p class="muted">保存后自动更新能明确识别的内容，保留原文，也可以撤销。</p>
    <form id="recipe-note-form"><label class="field">这次发现了什么？<textarea name="note" required maxlength="2000" rows="6" placeholder="例如：和面忘了先把盐溶在水里；面条折痕很厚。或：盐改成 1g。"></textarea></label>
    <div class="note">目前支持：手工面溶盐与折痕提醒、老抽白糖炒面的喜欢吃法、已有调料的明确克数修改。未识别的内容会作为下次提醒。</div>
    <button class="btn">保存并更新菜谱</button> <button type="button" class="btn ghost" onclick="openRecipe(${id})">返回菜谱</button></form>`);
  $('#recipe-note-form').onsubmit = event => {
    event.preventDefault();
    const entry = applyRecipeNote(id, new FormData(event.target).get('note'));
    if (!entry) return;
    render();
    openRecipe(id);
    toast(entry.changes.length ? `已更新 ${entry.changes.length} 处，原备注已保留` : '已保存为下次提醒，配方用量未改动');
  };
}

const baseFeedback = feedback;
feedback = function(id) {
  baseFeedback(id);
  const form = $('#feedback');
  form.querySelector('button').insertAdjacentHTML('beforebegin', '<label class="field"><input type="checkbox" name="autoRecipe" checked style="display:inline;width:auto"> 根据备注自动更新我的菜谱（可撤销）</label><p class="muted">未识别的内容保留为提醒；不会根据“偏咸”擅自猜一个克数。</p>');
  const baseSubmit = form.onsubmit;
  form.onsubmit = event => {
    const data = new FormData(event.target);
    const note = data.get('note');
    const auto = data.get('autoRecipe');
    baseSubmit(event);
    if (auto && String(note || '').trim()) {
      const entry = applyRecipeNote(id, note, '饭后反馈');
      render();
      openRecipe(id);
      toast(entry.changes.length ? '反馈已保存，菜谱也更新了' : '反馈已保存，备注会在下次提醒你');
    }
  };
};

// Import the actual experience shared in chat once; never invent a meal rating or ingredient weight.
if (!state.importedNoodleExperience20261029) {
  applyRecipeNote(3, '上次做手工面条，和面时忘记先把盐融入水中。面擀薄后折起来切，折痕处很厚。后来做炒面加了点老抽＋白糖，还挺好吃的。', '聊天中记录的经验', false);
  state.importedNoodleExperience20261029 = true;
  save();
}
// Stock editing uses the same browser storage as the original inventory.
function commitStockChange(pending) {
  try {
    localStorage.setItem('easy-meals-v1', JSON.stringify(pending));
  } catch {
    toast('未能保存库存，请检查浏览器存储后重试');
    return false;
  }
  state = pending;
  return true;
}

stockRows = function() {
  const rows = state.stock.map((s, i) => `<div class="row" style="flex-wrap:wrap"><span class="stock-icon">${esc(s.icon)}</span><div class="stock-name" style="min-width:100px">${esc(s.name)}<div class="muted">${s.grams}g / 份</div><div style="display:flex;gap:12px;margin-top:5px"><button class="stock-link" onclick="editStock(${i})">编辑</button><button class="stock-link" style="color:#9b6558" onclick="deleteStock(${i})">删除</button></div></div><div class="counter"><button aria-label="取用${esc(s.name)}一份" onclick="useStock(${i})" ${s.count < 1 ? 'disabled' : ''}>−</button><b>${s.count}</b><span class="muted">份</span></div></div>`).join('');
  const undo = state.lastDeletedStock ? `<div class="note">已删除「${esc(state.lastDeletedStock.item.name)}」 <button class="stock-link" onclick="restoreStock()">撤销删除</button></div>` : '';
  return (rows || '<p class="muted">冷冻存货已经清空，可以记一笔新的备餐。</p>') + undo;
};

function editStock(index) {
  const item = state.stock[index];
  if (!item) return;
  show(`<h2>编辑冷冻存货</h2><p class="muted">修改后点保存，首页和库存页都会更新。</p><form id="edit-stock-form">
    <label class="field">名称<input name="name" required maxlength="40" value="${esc(item.name)}"></label>
    <label class="field">剩余份数<input name="count" type="number" min="0" max="1000" step="1" required value="${item.count}"></label>
    <label class="field">每份多少克<input name="grams" type="number" min="0.1" max="5000" step="0.1" required value="${item.grams}"></label>
    <p class="muted" id="stock-edit-status" role="status"></p><button class="btn">保存修改</button> <button class="btn ghost" type="button" onclick="closeModal()">取消</button></form>`);
  $('#edit-stock-form').onsubmit = event => {
    event.preventDefault();
    const data = new FormData(event.target);
    const result = updateStock(index, {name:String(data.get('name') || '').trim(),count:Number(data.get('count')),grams:Number(data.get('grams'))});
    if (!result) return;
    closeModal();
    render();
    toast('冷冻存货已保存');
  };
}

function updateStock(index, values) {
  if (!state.stock[index] || !values.name || values.name.length > 40 || !Number.isInteger(values.count) || values.count < 0 || values.count > 1000 || !Number.isFinite(values.grams) || values.grams < 0.1 || values.grams > 5000 || Math.abs(values.grams * 10 - Math.round(values.grams * 10)) > 1e-8) {
    toast('请填写名称、非负整数份数，以及有效的每份克数（最多一位小数）');
    return false;
  }
  const pending = structuredClone(state);
  Object.assign(pending.stock[index], values);
  return commitStockChange(pending);
}

function deleteStock(index) {
  if (!state.stock[index]) return;
  const pending = structuredClone(state);
  pending.lastDeletedStock = {item:pending.stock[index],index};
  pending.stock.splice(index, 1);
  if (!commitStockChange(pending)) return;
  render();
  toast('已删除，可在列表下方撤销');
}

function restoreStock() {
  if (!state.lastDeletedStock) return;
  const pending = structuredClone(state);
  const {item,index} = pending.lastDeletedStock;
  pending.stock.splice(Math.min(index, pending.stock.length), 0, item);
  delete pending.lastDeletedStock;
  if (!commitStockChange(pending)) return;
  render();
  toast('已恢复这条存货');
}
render();
