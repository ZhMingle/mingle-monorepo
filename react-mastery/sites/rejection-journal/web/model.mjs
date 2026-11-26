export const STORAGE_KEY='rejection-journal.v1';
export const GOAL=100;
export const stages={application:'投递后被拒绝',interview:'面试后被拒绝'};
export function localDate(){const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
function clean(value,max,label){if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw Error(`请填写有效的${label}（最多 ${max} 字）。`);return value.trim();}
export function validateRecord(value){
  if(!value||typeof value!=='object')throw Error('记录格式不正确。');
  const company=clean(value.company,100,'公司名'),position=clean(value.position,120,'岗位'),reason=clean(value.reason,3000,'失败原因');
  if(!Object.hasOwn(stages,value.stage))throw Error('请选择拒绝阶段。');
  if(typeof value.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value.date))throw Error('请选择有效的拒绝日期。');
  const parsed=new Date(value.date+'T12:00:00Z');
  if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value.date)throw Error('拒绝日期不存在。');
  if(typeof value.id!=='string'||value.id.length<1||value.id.length>100)throw Error('记录标识不正确。');
  for(const field of ['createdAt','updatedAt'])if(typeof value[field]!=='string'||!Number.isFinite(Date.parse(value[field])))throw Error('记录时间不正确。');
  return {id:value.id,company,position,stage:value.stage,date:value.date,reason,createdAt:value.createdAt,updatedAt:value.updatedAt};
}
const normalize=value=>value.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
export const positionKey=record=>JSON.stringify([normalize(record.company),normalize(record.position)]);
export function upsertRecord(records,value){
  const record=validateRecord(value),key=positionKey(record);
  const duplicate=records.find(item=>item.id!==record.id&&positionKey(item)===key);
  if(duplicate)throw Error('这个公司和岗位已有记录，请编辑原记录，避免重复计数。');
  const exists=records.some(item=>item.id===record.id);
  return exists?records.map(item=>item.id===record.id?record:item):[record,...records];
}
export function parseBackup(text){
  let value;try{value=JSON.parse(text);}catch{throw Error('文件不是有效的 JSON 备份。');}
  if(value?.version!==1||!Array.isArray(value.records)||value.records.length>10000)throw Error('备份格式不支持，请选择本网站导出的备份文件。');
  const records=value.records.map(validateRecord),ids=new Set(),keys=new Set();
  for(const record of records){const key=positionKey(record);if(ids.has(record.id)||keys.has(key))throw Error('备份中有重复记录，请检查后重试。');ids.add(record.id);keys.add(key);}
  return records;
}
export function mergeRecords(existing,incoming){
  const ids=new Set(existing.map(item=>item.id)),keys=new Set(existing.map(positionKey));const added=[];
  for(const record of incoming){const key=positionKey(record);if(ids.has(record.id)||keys.has(key))continue;added.push(record);ids.add(record.id);keys.add(key);}
  return {records:[...added,...existing],added:added.length,skipped:incoming.length-added.length};
}
export const encodeBackup=records=>JSON.stringify({version:1,exportedAt:new Date().toISOString(),records},null,2);
export function statistics(records){const application=records.filter(item=>item.stage==='application').length;return {total:records.length,application,interview:records.length-application,percent:Math.min(100,Math.round(records.length/GOAL*100))};}
export function visibleRecords(records,stage,query){const search=normalize(query);return records.filter(record=>(!stage||record.stage===stage)&&(!search||normalize(`${record.company} ${record.position} ${record.reason}`).includes(search))).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));}
