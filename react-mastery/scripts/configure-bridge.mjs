import {readSecretJSON} from './secret-input.ts';
import {mkdirSync,writeFileSync} from 'node:fs';
const config=await readSecretJSON();
if(new URL(config.origin).protocol!=='https:'||new URL(config.siteOrigin).protocol!=='https:'||!new URL(config.siteOrigin).hostname.endsWith('.chatgpt.site')||typeof config.key!=='string'||config.key.length<32)throw new Error('Invalid bridge configuration.');
mkdirSync('data',{recursive:true});writeFileSync('data/cloud-bridge.json',JSON.stringify(config),{mode:0o600});
console.log('Configured the private local Codex bridge.');
