const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/app.js','utf8');
const refreshSource=source.slice(source.indexOf('async function refresh()'),source.indexOf("$('#refresh').onclick"));
async function run(total,fail=false){
 const calls=[],messages=[],controls={};let active=0,maxActive=0;
 const ctx={URLSearchParams,Date,Number,Set,Promise,Error,demo:false,busy:false,mails:[{id:'previous',trash:false}],selected:new Set(),undo:{},classify:()=> 'personal',render:()=>{},toast:s=>messages.push(s),$:s=>controls[s]??={},api:async path=>{calls.push(path);if(path.startsWith('messages?')){const q=new URLSearchParams(path.split('?')[1]);assert(Number(q.get('maxResults'))<=500);const start=Number(q.get('pageToken')||0),end=Math.min(total,start+Number(q.get('maxResults')));return{messages:Array.from({length:end-start},(_,i)=>({id:String(start+i)})),...(end<total?{nextPageToken:String(end)}:{})}}active++;maxActive=Math.max(active,maxActive);await Promise.resolve();active--;if(fail)throw Error('network failure');return{id:path.split('/')[1].split('?')[0],payload:{headers:[]},labelIds:['INBOX'],internalDate:'1'}}};
 vm.createContext(ctx);vm.runInContext(refreshSource+';globalThis.runRefresh=refresh',ctx);await ctx.runRefresh();assert.equal(ctx.busy,false);assert.equal(controls['#refresh'].disabled,false);assert(maxActive<=5);
 if(fail){assert.equal(ctx.mails[0].id,'previous');assert(messages.at(-1).includes('同步失败'))}else{assert.equal(ctx.mails.length,Math.min(total,1000));assert.equal(calls.filter(x=>!x.startsWith('messages?')).length,Math.min(total,1000));assert.equal(new Set(ctx.mails.map(x=>x.id)).size,ctx.mails.length);if(total>1000)assert(messages.at(-1).includes('1000 封上限'))}
}
(async()=>{for(const n of [0,37,500,700,1000,1400])await run(n);await run(37,true);console.log('PASS: empty/short/multiple pages, 1000 cap, concurrency, failure preservation')})().catch(e=>{console.error(e);process.exitCode=1});
