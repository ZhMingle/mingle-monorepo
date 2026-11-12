import {presentationStrings,presentationIdentifiers,presentationBatches} from '../shared/presentation.ts';
type Language='en'|'zh';
type Translations=Record<string,string>;
export class PresentationCache {
  private cache=new Map<string,Translations>();
  private pending=new Map<string,Promise<Translations>>();
  private load:(texts:string[],language:Language,identifiers:string[],background:boolean)=>Promise<Translations>;
  constructor(load:(texts:string[],language:Language,identifiers:string[],background:boolean)=>Promise<Translations>){this.load=load;}
  key(payload:unknown,language:Language){return JSON.stringify([language,presentationStrings(payload),presentationIdentifiers(payload)]);}
  get(payload:unknown,language:Language){return this.cache.get(this.key(payload,language));}
  prepare(payload:unknown,language:Language,background=false):Promise<Translations>{
    const key=this.key(payload,language),cached=this.cache.get(key);
    if(cached)return Promise.resolve(cached);
    const pending=this.pending.get(key);if(pending)return pending;
    const task=(async()=>{
      const result:Translations={};
      for(const texts of presentationBatches(presentationStrings(payload)))Object.assign(result,await this.load(texts,language,presentationIdentifiers(payload),background));
      this.cache.set(key,result);return result;
    })();
    this.pending.set(key,task);
    void task.finally(()=>this.pending.delete(key)).catch(()=>{});
    return task;
  }
}
