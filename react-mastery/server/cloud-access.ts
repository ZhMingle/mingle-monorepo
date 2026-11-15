import {createHash,timingSafeEqual} from 'node:crypto';
import type {IncomingMessage} from 'node:http';

export function secretMatches(actual:unknown,expected:string|undefined):boolean {
  if(typeof actual!=='string'||!expected||expected.length<32)return false;
  const hash=(value:string)=>createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(actual),hash(expected));
}
export function cloudSettings(env:NodeJS.ProcessEnv=process.env){
  const enabled=env.CLARITY_CLOUD==='1';
  if(!enabled)return {enabled:false,origin:'',host:'127.0.0.1'};
  const origin=new URL(env.PUBLIC_ORIGIN??'');
  if(origin.protocol!=='https:'||origin.origin!==env.PUBLIC_ORIGIN||origin.username||origin.password||!env.CLARITY_PROXY_KEY||env.CLARITY_PROXY_KEY.length<32)throw new Error('Cloud mode requires an exact HTTPS PUBLIC_ORIGIN and a strong proxy key.');
  return {enabled:true,origin:origin.origin,host:'0.0.0.0'};
}
export function cloudAuthorized(req:Pick<IncomingMessage,'headers'>,path:string,env:NodeJS.ProcessEnv=process.env):boolean {
  if(env.CLARITY_CLOUD!=='1')return true;
  if(path.startsWith('/api/bridge/'))return secretMatches(req.headers['x-clarity-bridge-key'],env.CLARITY_BRIDGE_KEY);
  if(['/api/admin/migrate','/api/admin/migration-status','/api/admin/repair-migration'].includes(path))return secretMatches(req.headers['x-clarity-migration-key'],env.CLARITY_MIGRATION_KEY);
  return secretMatches(req.headers['x-clarity-proxy-key'],env.CLARITY_PROXY_KEY);
}
