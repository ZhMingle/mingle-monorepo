import {STORAGE_KEY,GOAL,stages,localDate,upsertRecord,parseBackup,mergeRecords,visibleRecords} from './model.mjs';

const $=selector=>document.querySelector(selector);
const dialog=$('#record-dialog'),form=$('#record-form');
let records=[],filter='',query='',editingId=null,deleted=null,storageBlocked=false;
const dateFormat=new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});
function readRecords(){const text=localStorage.getItem(STORAGE_KEY);return text?parseBackup(text):[];}
function storageError(){storageBlocked=true;$('#storage-error').hidden=false;$('#storage-error').textContent='无法读取浏览器记录，已停止写入以保留原始数据。可先导出备份。若浏览器禁用了本地存储，请允许后刷新页面。';}
try{records=readRecords();}catch{storageError();}
function notify(message,undo=false){$('#toast-copy').textContent=message;$('#undo-delete').hidden=!undo;$('#toast').hidden=false;}
function mutate(transform){
  if(storageBlocked)throw Error('暂时无法保存。请先检查页面上的存储提示。');
  let latest;try{latest=readRecords();}catch{storageError();throw Error('无法读取现有记录，已停止保存。');}
  const next=transform(latest);
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,records:next}));}catch{throw Error('保存失败，浏览器存储空间不足或不可用。请导出备份后重试。');}
  records=next;render();
}
function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#i-'+name);svg.append(use);svg.setAttribute('aria-hidden','true');return svg;}
function render(){
  $('#total').textContent=records.length;
  const percent=Math.min(GOAL,records.length);
  $('#percent').textContent=percent+'%';
  const dots=$('#progress-dots');dots.replaceChildren();dots.setAttribute('aria-valuenow',percent);dots.setAttribute('aria-valuetext',`已记录 ${records.length} 次，目标 ${GOAL} 次`);
  for(let i=0;i<GOAL;i++)dots.append(element('span',i<percent?'filled':''));
  $('#goal-copy').textContent=records.length>=GOAL?'100 次认真尝试。先停下来，看看自己已经走了多远。':records.length?`已记下 ${records.length} 次尝试，距离目标还有 ${GOAL-records.length} 次。`:'路还长，先从记录第一次开始。';
  for(const stage of Object.keys(stages))$('#'+stage+'-count').textContent=records.filter(record=>record.stage===stage).length;
  $('#record-count').textContent=records.length;
  const list=$('#record-list'),visible=visibleRecords(records,filter,query);list.replaceChildren();
  if(!visible.length){
    const empty=element('div','empty-state');
    const drawing=element('div','empty-drawing');drawing.append(icon('archive'));empty.append(drawing);
    empty.append(element('h3','',records.length?'暂时没有匹配的记录':'你的下一篇，从这里开始。'));
    empty.append(element('p','',records.length?'换个关键词，或查看全部记录。':'记录一次真实的尝试。公司、岗位、原因，慢慢整理。'));
    const button=element('button','empty-button',records.length?'清除筛选':'记下第一次尝试');button.append(icon('arrow'));
    button.addEventListener('click',()=>{if(records.length){filter='';query='';$('#search').value='';updateFilters();render();}else openForm();});empty.append(button);list.append(empty);return;
  }
  for(const record of visible){
    const article=element('article','record'),heading=element('div','record-heading'),identity=element('div','record-identity');
    const monogram=element('span','company-mark',Array.from(record.company)[0]);monogram.setAttribute('aria-hidden','true');
    const title=element('div','record-title');title.append(element('h3','',record.company),element('p','position',record.position));identity.append(monogram,title);heading.append(identity);
    const meta=element('div','record-meta');meta.append(element('span','stage-badge '+record.stage,stages[record.stage]));
    const time=element('time','record-date',dateFormat.format(new Date(record.date+'T12:00:00')));time.dateTime=record.date;meta.append(time);
    const edit=element('button','icon-button');edit.append(icon('edit'));edit.setAttribute('aria-label',`编辑 ${record.company} 的 ${record.position} 记录`);edit.title='编辑记录';edit.addEventListener('click',()=>openForm(record));meta.append(edit);heading.append(meta);article.append(heading);
    const body=element('div','record-reason');body.append(element('span','reason-caption','原因 / 复盘'),element('p','',record.reason));article.append(body);
    const foot=element('div','record-foot');foot.append(element('span','',`第 ${records.length-records.indexOf(record)} 次尝试 · 向前一步`));const remove=element('button','delete-button','删除');remove.setAttribute('aria-label',`删除 ${record.company} 的 ${record.position} 记录`);remove.addEventListener('click',()=>{
      try{mutate(latest=>latest.filter(item=>item.id!==record.id));deleted=record;notify('已删除这条记录。',true);}catch(error){notify(error.message);}
    });foot.append(remove);article.append(foot);list.append(article);
  }
}
function updateFilters(){for(const button of document.querySelectorAll('[data-filter]')){const active=button.dataset.filter===filter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}}
function openForm(record){
  editingId=record?.id??null;form.reset();$('#form-title').textContent=record?'编辑这次尝试':'记下一次尝试';$('#save-record').firstChild.textContent=record?'保存修改 ':'保存记录 ';
  for(const field of ['company','position','reason'])form.elements[field].value=record?.[field]??'';
  form.elements.stage.value=record?.stage??'application';form.elements.date.value=record?.date??localDate();$('#form-error').hidden=true;dialog.showModal();form.elements.company.focus();
}
function closeForm(){dialog.close();}
$('#new-record').addEventListener('click',()=>openForm());$('#close-dialog').addEventListener('click',closeForm);$('#cancel-dialog').addEventListener('click',closeForm);
$('#unknown-reason').addEventListener('click',()=>{const input=form.elements.reason;input.value=input.value.trim()?input.value+'\n招聘方未告知具体原因。':'招聘方未告知具体原因。';input.focus();});
form.addEventListener('submit',event=>{
  event.preventDefault();const existing=records.find(record=>record.id===editingId),now=new Date().toISOString();
  const record={id:editingId??crypto.randomUUID(),createdAt:existing?.createdAt??now,updatedAt:now};
  for(const field of ['company','position','reason','stage','date'])record[field]=form.elements[field].value;
  try{mutate(latest=>upsertRecord(latest,record));filter='';query='';$('#search').value='';updateFilters();render();closeForm();notify(editingId?'记录已更新。':'已记下一次尝试，继续向前。');}catch(error){$('#form-error').textContent=error.message;$('#form-error').hidden=false;}
});
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{filter=button.dataset.filter;updateFilters();render();});
$('#search').addEventListener('input',event=>{query=event.target.value;render();});
$('#dismiss-toast').addEventListener('click',()=>{$('#toast').hidden=true;});
$('#undo-delete').addEventListener('click',()=>{if(!deleted)return;try{mutate(latest=>{if(latest.some(item=>item.id===deleted.id))return latest;return upsertRecord(latest,deleted);});deleted=null;notify('记录已恢复。');}catch(error){notify(error.message);}});
$('#export-button').addEventListener('click',()=>{
  try{const raw=localStorage.getItem(STORAGE_KEY);const blob=new Blob([raw??JSON.stringify({version:1,records:[]},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`再试一次-求职记录-${localDate()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('备份已导出，请妥善保存文件。');}catch{notify('无法读取本地记录，备份未导出。');}
});
$('#import-button').addEventListener('click',()=>$('#import-file').click());
$('#import-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  try{if(file.size>10*1024*1024)throw Error('备份文件需小于 10 MB。');const incoming=parseBackup(await file.text());let added=0;mutate(latest=>{const merged=mergeRecords(latest,incoming);added=merged.added;return merged.records;});filter='';query='';$('#search').value='';updateFilters();render();notify(`导入 ${added} 条记录，跳过 ${incoming.length-added} 条重复记录。`);}catch(error){notify(error.message);}
});
window.addEventListener('storage',event=>{if(event.key!==STORAGE_KEY&&event.key!==null)return;try{records=readRecords();storageBlocked=false;$('#storage-error').hidden=true;render();}catch{storageError();}});
render();
