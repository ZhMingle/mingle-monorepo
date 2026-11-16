// Runs only on the owner's computer. Sign-in credentials never leave this machine.
import {readFileSync,existsSync} from 'node:fs';
import {runStructured} from '../server/coach.ts';
const config=JSON.parse(readFileSync('data/cloud-bridge.json','utf8')) as {origin:string;key:string};
const origin=new URL(config.origin);if(origin.protocol!=='https:'||config.key.length<32)throw new Error('Invalid bridge configuration.');
const pidPath='data/cloud-bridge.pid';
const {writeFileSync,unlinkSync}=await import('node:fs');
if(existsSync(pidPath)){const pid=Number(readFileSync(pidPath,'utf8'));try{process.kill(pid,0);console.log('Cloud bridge is already running.');process.exit(0);}catch{/* Stale bridge PID. */}}
writeFileSync(pidPath,String(process.pid));
process.on('exit',()=>{try{if(readFileSync(pidPath,'utf8')===String(process.pid))unlinkSync(pidPath);}catch{/* Already removed. */}});
async function call(path:string,body:unknown){const response=await fetch(new URL('/api/bridge/'+path,origin),{method:'POST',redirect:'error',headers:{'Content-Type':'application/json','X-Clarity-Bridge-Key':config.key},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const result=await response.json();if(!response.ok)throw new Error(result.error??'Bridge request failed.');return result;}
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
async function heartbeat(){for(;;){try{await call('heartbeat',{});}catch{/* Retry without logging private data. */}await sleep(10000);}}
async function work(){for(;;){try{const {job}=await call('claim',{});if(!job){await sleep(1200);continue;}let result:unknown,error:string|undefined;try{result=await runStructured(job.prompt,job.schema,job.priority);}catch(cause){error=(cause as Error).message;}await call('complete',{id:job.id,lease:job.lease,result,error});}catch{await sleep(3000);}}}
async function speech(){
  if(!existsSync('local-speech/node_modules/kokoro-js')){console.log('Local speech is not installed. See local-speech/README.md.');return;}
  const moduleURL=new URL('../local-speech/speech.mjs',import.meta.url).href;
  let model: {loadSpeech:()=>Promise<unknown>;generateSpeech:(text:string,voice:string)=>Promise<Buffer>};
  for(;;){try{model=await import(moduleURL);await model.loadSpeech();break;}catch{console.error('Local speech could not start; retrying in 30 seconds.');await sleep(30000);}}
  console.log('Kokoro local neural speech is ready.');
  const heartbeat=async()=>{for(;;){try{await call('speech/heartbeat',{});}catch{/* Retry connection. */}await sleep(10000);}};
  const work=async()=>{for(;;){try{
    const {job}=await call('speech/claim',{});if(!job){await sleep(1000);continue;}
    let audio:string|undefined,error:string|undefined;
    try{audio=(await model.generateSpeech(job.text,job.voice)).toString('base64');}catch{error='本机语音生成失败，请重试。 / Local speech generation failed. Please retry.';}
    await call('speech/complete',{id:job.id,lease:job.lease,audio,error});
  }catch{await sleep(3000);}}};
  await Promise.all([heartbeat(),work()]);
}
console.log('Clarity cloud bridge is running. Keep this computer awake for AI requests.');
await Promise.all([heartbeat(),work(),work(),speech()]);
