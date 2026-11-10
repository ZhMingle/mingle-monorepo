import {test} from 'node:test';
import assert from 'node:assert/strict';
import {request} from '../src/api.ts';

test('requests use the saved Chinese preference before the document language effect runs',async()=>{
  const originals=Object.fromEntries(['localStorage','document','fetch'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  let saved:string|null='zh';let header='';
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>saved}});
  Object.defineProperty(globalThis,'document',{configurable:true,value:{documentElement:{lang:'en'}}});
  Object.defineProperty(globalThis,'fetch',{configurable:true,value:async(_url:unknown,init:RequestInit)=>{
    header=(init.headers as Record<string,string>)['X-Clarity-Language'];
    return {ok:true,json:async()=>({})};
  }});
  try {
    await request('study/open',{topicId:'shopify.architecture'});assert.equal(header,'zh');
    saved='en';await request('study/open',{});assert.equal(header,'en');
    saved=null;await request('study/open',{});assert.equal(header,'en');
  } finally {
    for(const [key,descriptor] of Object.entries(originals)){
      if(descriptor)Object.defineProperty(globalThis,key,descriptor);
      else Reflect.deleteProperty(globalThis,key);
    }
  }
});
