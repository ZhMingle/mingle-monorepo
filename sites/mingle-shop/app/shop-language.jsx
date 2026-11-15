'use client';
import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {translate,translateError} from '../lib/locale.mjs';

const ShopLanguageContext = createContext(null);
const storageKey = 'mc-admin-language';

export function ShopLanguage({admin,children}) {
  const [language,setLanguage] = useState(admin?'zh':'en');
  useEffect(() => {
    if (!admin) return;
    try { const saved=localStorage.getItem(storageKey); if(saved==='en'||saved==='zh')setLanguage(saved); } catch {}
  }, [admin]);
  useEffect(() => { document.documentElement.lang=language==='en'?'en-NZ':'zh-CN'; }, [language]);
  const value=useMemo(() => ({
    admin,
    lang:language,
    t:value=>translate(language,value),
    setLanguage:next=>{
      if(!admin||!['en','zh'].includes(next))return;
      setLanguage(next);
      try{localStorage.setItem(storageKey,next);}catch{}
    },
    api:async(path,data)=>{
      const response=await fetch('/api/'+path,{headers:{'X-Shop-Language':language,...(data===undefined?{}:{'Content-Type':'application/json'})},...(data===undefined?{}:{method:'POST',body:JSON.stringify(data)})});
      const result=await response.json();
      if(!response.ok)throw Error(translateError(language,result.error||'暂时无法完成操作。'));
      return result;
    },
  }),[language,admin]);
  return <ShopLanguageContext.Provider value={value}>{children}</ShopLanguageContext.Provider>;
}

export function useI18n(){return useContext(ShopLanguageContext);}

export function LanguageSwitch(){
  const {lang,setLanguage}=useI18n();
  return <div className="language-switch" role="group" aria-label="管理语言 / Management language"><button type="button" lang="zh-CN" aria-pressed={lang==='zh'} onClick={()=>setLanguage('zh')}>中文</button><button type="button" lang="en" aria-pressed={lang==='en'} onClick={()=>setLanguage('en')}>English</button></div>;
}
