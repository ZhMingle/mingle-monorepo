'use client';
import {useEffect,useState} from 'react';
import {Smartphone,Download,X} from 'lucide-react';
export default function MobileApp({admin}) {
  const [install,setInstall]=useState(null),[help,setHelp]=useState(false),[standalone,setStandalone]=useState(true);
  useEffect(()=>{
    setStandalone(window.matchMedia('(display-mode: standalone)').matches||!!navigator.standalone);
    if('serviceWorker' in navigator)navigator.serviceWorker.register('/shop-sw.js').catch(()=>{});
    const before=e=>{e.preventDefault();setInstall(e);},installed=()=>{setStandalone(true);setInstall(null);};
    window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',installed);
    return()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',installed);};
  },[]);
  if(!admin||standalone)return null;
  return <div className="install-hint"><Smartphone size={18}/><div><strong>把小店放到手机主屏幕</strong><p>{help?'在手机浏览器菜单中选择“添加到主屏幕”或“安装应用”，下次一点就能打开。':'拍照、上新、回消息，打开更方便。'}</p></div>{install?<button onClick={async()=>{await install.prompt();setInstall(null);}}><Download size={16}/>添加</button>:<button onClick={()=>setHelp(!help)}>{help?<X size={16}/>:'怎么添加'}</button>}</div>;
}
