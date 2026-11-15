'use client';
import {useEffect,useState} from 'react';
import {Smartphone,Download,X,Maximize2,Minimize2} from 'lucide-react';
export default function MobileApp({admin}) {
  const [install,setInstall]=useState(null),[help,setHelp]=useState(false),[standalone,setStandalone]=useState(true);
  const [fullscreen,setFullscreen]=useState(false),[canFullscreen,setCanFullscreen]=useState(false),[screenError,setScreenError]=useState(''),[platform,setPlatform]=useState('');
  useEffect(()=>{
    const standaloneQuery=window.matchMedia('(display-mode: standalone)'),fullscreenQuery=window.matchMedia('(display-mode: fullscreen)');
    const sync=()=>{
      const installed=standaloneQuery.matches||fullscreenQuery.matches||!!navigator.standalone;
      const full=document.fullscreenElement===document.documentElement;
      setStandalone(installed);setFullscreen(full);
      document.documentElement.dataset.shopDisplay=full?'fullscreen':installed?'standalone':'browser';
    };
    sync();setCanFullscreen(!!document.fullscreenEnabled&&typeof document.documentElement.requestFullscreen==='function');
    setPlatform(/Android/i.test(navigator.userAgent)?'android':/iPhone|iPad|iPod/i.test(navigator.userAgent)?'ios':'other');
    if('serviceWorker' in navigator)navigator.serviceWorker.register('/shop-sw.js').catch(()=>{});
    const before=e=>{e.preventDefault();setInstall(e);},installed=()=>{sync();setInstall(null);};
    window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',installed);
    document.addEventListener('fullscreenchange',sync);
    standaloneQuery.addEventListener('change',sync);fullscreenQuery.addEventListener('change',sync);
    return()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',installed);document.removeEventListener('fullscreenchange',sync);standaloneQuery.removeEventListener('change',sync);fullscreenQuery.removeEventListener('change',sync);delete document.documentElement.dataset.shopDisplay;};
  },[]);
  const enterFullscreen=async()=>{
    setScreenError('');
    try{await document.documentElement.requestFullscreen({navigationUI:'hide'});}
    catch{setScreenError('此浏览器未允许全屏。安卓可使用 Chrome 的安装应用入口；普通网页不能自行隐藏网址栏。');}
  };
  const exitFullscreen=async()=>{
    setScreenError('');
    try{await document.exitFullscreen();}
    catch{setScreenError('请按手机返回键退出全屏。');}
  };
  const installApp=async()=>{
    setScreenError('');
    try{await install.prompt();const result=await install.userChoice;if(result.outcome==='accepted')setInstall(null);}
    catch{setScreenError('安装入口暂不可用，请从浏览器菜单选择安装应用。');setInstall(null);}
  };
  if(!admin)return null;
  if(fullscreen)return <div className="immersive-controls"><span><Maximize2 size={13}/> 全屏管理</span><button type="button" onClick={exitFullscreen}><Minimize2 size={14}/>退出全屏</button>{screenError&&<p role="alert">{screenError}</p>}</div>;
  if(!admin||standalone)return null;
  return <section className="app-launcher" aria-label="沉浸管理入口"><div className="app-launcher-copy"><span className="app-launcher-icon"><Smartphone size={21}/></span><div><strong>像 App 一样打理小店</strong><p>{canFullscreen?'点全屏管理，收起浏览器网址栏。':'安装为独立应用，从桌面图标打开。'}</p></div></div><div className="app-launcher-actions">{canFullscreen&&<button type="button" className="button screen-launch" onClick={enterFullscreen}><Maximize2 size={16}/>全屏管理</button>}{install&&<button type="button" className="button secondary" onClick={installApp}><Download size={15}/>安装应用</button>}<button type="button" className="screen-help" aria-expanded={help} onClick={()=>setHelp(!help)}>{help?<><X size={14}/>收起</>:'以后直接打开'}</button></div>{help&&<div className="screen-install-help">{platform==='ios'?<p>Safari → 分享 → 添加到主屏幕。如有“作为网页 App 打开”，请开启，再从桌面图标启动。</p>:<p>安卓 Chrome → 菜单 → 安装应用（或“添加到主屏幕”→“安装”）。安装完成后从桌面图标启动；普通网页快捷方式可能仍显示网址栏。</p>}<p>全屏需主动点击。离开页面、切换应用或打开外部登录页后，浏览器可能退出全屏。</p></div>}{screenError&&<p className="screen-error" role="alert">{screenError}</p>}</section>;
}
