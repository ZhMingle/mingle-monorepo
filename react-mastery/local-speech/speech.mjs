import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {KokoroTTS} from 'kokoro-js';
const require=createRequire(import.meta.url);
const transformers=await import(pathToFileURL(createRequire(require.resolve('kokoro-js')).resolve('@huggingface/transformers').replace(/\.cjs$/,'.mjs')).href);
transformers.env.cacheDir=fileURLToPath(new URL('../data/speech-models/',import.meta.url));
let loading;
export function loadSpeech(){
  return loading??=KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'cpu',progress_callback:progress=>{
    if(progress.status==='initiate')console.log('Preparing speech model:',progress.file);
  }}).catch(error=>{loading=undefined;throw error;});
}
export async function generateSpeech(text,voice='af_heart'){
  if(typeof text!=='string'||!text.trim()||text.length>300||!['af_heart','bf_emma'].includes(voice))throw new Error('Invalid speech request.');
  const model=await loadSpeech();
  const audio=await model.generate(text,{voice,speed:1});
  const samples=audio.audio;
  if(!(samples instanceof Float32Array)||audio.sampling_rate!==24000||!samples.length||samples.length>24000*45)throw new Error('Unexpected speech audio.');
  const wav=Buffer.alloc(44+samples.length*2);
  wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(24000,24);wav.writeUInt32LE(48000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40);
  for(let i=0;i<samples.length;i++)wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),44+i*2);
  return wav;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const {writeFile,mkdir}=await import('node:fs/promises');
  await mkdir(new URL('../data/',import.meta.url),{recursive:true});
  const started=Date.now();
  const wav=await generateSpeech('Could you give me a hand? I am trying to figure this out.');
  await writeFile(new URL('../data/kokoro-preview.wav',import.meta.url),wav);
  console.log(JSON.stringify({ready:true,bytes:wav.length,seconds:(wav.length-44)/48000,elapsedMs:Date.now()-started}));
}
