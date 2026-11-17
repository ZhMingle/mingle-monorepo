import {presentationStrings,presentationIdentifiers,presentationBatches,codeTokens} from '../shared/presentation.ts';
type Language='en'|'zh';
type Translations=Record<string,string>;
export class PresentationCache {
  private cache=new Map<string,Translations>();
  private pending=new Map<string,Promise<Translations>>();
  private items=new Map<string,string>();
  private load:(texts:string[],language:Language,identifiers:string[],background:boolean)=>Promise<Translations>;
  constructor(load:(texts:string[],language:Language,identifiers:string[],background:boolean)=>Promise<Translations>){this.load=load;}
  key(payload:unknown,language:Language){return JSON.stringify([language,presentationStrings(payload),presentationIdentifiers(payload)]);}
  private itemKey(text:string,language:Language,identifiers:string[]){return JSON.stringify([language,identifiers,text]);}
  seed(payload:unknown,language:Language,translations:Translations){
    const identifiers=presentationIdentifiers(payload);let changed=false;
    for(const text of presentationStrings(payload)){
      const value=translations[text];if(typeof value!=='string'||!value.trim()||value.length>30000||JSON.stringify(codeTokens(text))!==JSON.stringify(codeTokens(value)))continue;
      const key=this.itemKey(text,language,identifiers);if(this.items.get(key)!==value){this.items.set(key,value);changed=true;}
    }
    if(changed)this.cache.clear();
  }
  get(payload:unknown,language:Language){
    const key=this.key(payload,language),cached=this.cache.get(key);if(cached)return cached;
    const texts=presentationStrings(payload),identifiers=presentationIdentifiers(payload);
    if(texts.some(text=>!this.items.has(this.itemKey(text,language,identifiers))))return undefined;
    const result=Object.fromEntries(texts.map(text=>[text,this.items.get(this.itemKey(text,language,identifiers))!]));this.cache.set(key,result);return result;
  }
  prepare(payload:unknown,language:Language,background=false):Promise<Translations>{
    const key=this.key(payload,language),cached=this.get(payload,language);
    if(cached)return Promise.resolve(cached);
    const pending=this.pending.get(key);if(pending)return pending;
    const task=(async()=>{
      const identifiers=presentationIdentifiers(payload);
      const missing=presentationStrings(payload).filter(text=>!this.items.has(this.itemKey(text,language,identifiers)));
      for(const texts of presentationBatches(missing))this.seed(payload,language,await this.load(texts,language,identifiers,background));
      const result=this.get(payload,language);if(!result)throw new Error('Incomplete prepared exercise text. Please retry.');return result;
    })();
    this.pending.set(key,task);
    void task.finally(()=>this.pending.delete(key)).catch(()=>{});
    return task;
  }
}
