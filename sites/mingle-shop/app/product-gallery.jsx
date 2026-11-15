'use client';
import {useState} from 'react';
import {Play} from 'lucide-react';
export function ProductCover({product,fallback}) {
  const media=product.media||[],first=media[0];
  if(first?.kind==='image')return <img src={first.url} alt={product.name} loading="lazy"/>;
  if(first?.kind==='video')return <div className="video-cover"><video src={first.url} muted playsInline preload="metadata"/><span><Play size={24}/> 商品视频</span></div>;
  return product.image_url?<img src={product.image_url} alt={product.name} loading="lazy" referrerPolicy="no-referrer"/>:fallback;
}
export function ProductGallery({product,fallback}) {
  const [index,setIndex]=useState(0),[videoError,setVideoError]=useState(false),media=product.media||[],selected=media[index];
  if(!media.length)return <div className="detail-art">{product.image_url?<img src={product.image_url} alt={product.name} referrerPolicy="no-referrer"/>:fallback}</div>;
  return <div className="product-gallery"><div className="gallery-main">{selected.kind==='image'?<img src={selected.url} alt={product.name+' · '+(index+1)}/>:<><video key={selected.id} src={selected.url} controls playsInline preload="metadata" onError={()=>setVideoError(true)}/>{videoError&&<p>此浏览器暂时无法播放。<a href={selected.url} download={selected.name}>下载视频查看</a></p>}</>}</div>{media.length>1&&<div className="gallery-thumbnails">{media.map((m,i)=><button type="button" key={m.id} aria-label={'查看'+(m.kind==='image'?'照片':'视频')+' '+(i+1)} aria-pressed={index===i} onClick={()=>{setIndex(i);setVideoError(false);}}>{m.kind==='image'?<img src={m.url} alt=""/>:<Play size={22}/>}</button>)}</div>}</div>;
}
