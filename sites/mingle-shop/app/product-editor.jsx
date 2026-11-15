'use client';
import {useI18n,LanguageSwitch} from './shop-language';
import {useEffect,useRef,useState} from 'react';
import useOverlayScrollLock from './use-overlay-scroll-lock';
import {Camera,ImagePlus,Video,Upload,Trash2,ArrowUp,ArrowDown,Sparkles,X,Check,LoaderCircle,ChevronRight} from 'lucide-react';
const categories=['手机支架','台灯','感应灯','键盘','鼠标','音响','其他'];
async function preparePhoto(file) {
  if(file.size>30*1024*1024)throw Error('原始照片最多 30 MB，请选择较小的照片。');
  const url=URL.createObjectURL(file);
  try {
    const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('这张照片无法读取。请改用 JPEG、PNG 或 WebP；HEIC 可先在相册导出为 JPEG。'));img.src=url;});
    const ratio=Math.min(1,1536/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
    const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.87));if(!blob)throw Error('照片处理失败，请重新选择。');
    return new File([blob],file.name.replace(/\.[^.]+$/,'').slice(0,150)+'.jpg',{type:'image/jpeg'});
  }finally{URL.revokeObjectURL(url);}
}
function uploadFile(file,onProgress,register,lang) {
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();register(xhr);xhr.open('POST','/api/admin/upload');xhr.setRequestHeader('X-Shop-Language',lang);xhr.setRequestHeader('Content-Type',file.type);xhr.setRequestHeader('X-Upload-Size',String(file.size));xhr.setRequestHeader('X-Upload-Name',encodeURIComponent(file.name));
    xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*100));};
    xhr.onerror=()=>reject(Error('网络中断，上传未完成，请重试。'));xhr.onabort=()=>reject(Error('上传已取消。'));
    xhr.onload=()=>{let result;try{result=JSON.parse(xhr.responseText);}catch{return reject(Error('上传连接失效，请刷新页面并重新登录。'));}if(xhr.status<200||xhr.status>=300)reject(Error(result.error||'上传失败，请重试。'));else resolve(result.media);};xhr.send(file);
  });
}
export default function ProductEditor({initial,onClose,save,busy,error,capabilities={}}) {
  const {t,lang}=useI18n();
  useOverlayScrollLock();
  const dialog=useRef(null),album=useRef(null),camera=useRef(null),video=useRef(null),uploadRef=useRef(null),aiAbort=useRef(null),alive=useRef(true);
  const [p,setP]=useState(initial),[media,setMedia]=useState(initial.media||[]),[price,setPrice]=useState(initial.price_cents===null?'':(initial.price_cents/100).toFixed(2)),[minimum,setMinimum]=useState(initial.minimum_cents===null?'':(initial.minimum_cents/100).toFixed(2));
  const [progress,setProgress]=useState(null),[generating,setGenerating]=useState(false),[localError,setLocalError]=useState(''),[language,setLanguage]=useState('en'),[autoGenerate,setAutoGenerate]=useState(true),[draft,setDraft]=useState(null),[applied,setApplied]=useState(false);
  const productRef=useRef(p);productRef.current=p;
  const working=busy||!!progress||generating;
  useEffect(()=>{alive.current=true;const element=dialog.current;element.showModal();return()=>{alive.current=false;uploadRef.current?.abort();aiAbort.current?.abort();element.close();};},[]);
  const change=(key,value)=>setP(old=>({...old,[key]:value}));
  const applyDraft=value=>{setP(old=>({...old,name:value.title,description:value.description,category:value.category}));setApplied(true);};
  const generate=async(files=media,automatic=false)=>{
    const images=files.filter(m=>m.kind==='image').slice(0,3);
    if(!images.length){setLocalError('先添加至少一张商品照片，再生成文案。');return;}
    if(!capabilities.photoGeneration){setLocalError('照片识别尚未启用。照片已保留，可以先手动填写商品文案。');return;}
    setGenerating(true);setLocalError('');setApplied(false);const controller=new AbortController();aiAbort.current=controller;
    try{const response=await fetch('/api/admin/generate',{method:'POST',headers:{'Content-Type':'application/json','X-Shop-Language':lang},signal:controller.signal,body:JSON.stringify({mediaIds:images.map(m=>m.id),language})});const result=await response.json();if(!response.ok)throw Error(result.error||'生成失败，请重试。');if(!alive.current)return;setDraft(result.draft);if(!automatic||(!productRef.current.name.trim()&&!productRef.current.description.trim()))applyDraft(result.draft);}
    catch(e){if(alive.current&&e.name!=='AbortError')setLocalError(e.message);}
    finally{if(alive.current)setGenerating(false);}
  };
  const selectFiles=async(event,kind)=>{
    const files=Array.from(event.target.files||[]);event.target.value='';if(!files.length||working)return;
    const limit=kind==='image'?8:2;
    if(media.filter(m=>m.kind===kind).length+files.length>limit){setLocalError(kind==='image'?'每件商品最多 8 张照片。':'每件商品最多 2 段视频。');return;}
    setLocalError('');let next=[...media],photoAdded=false,uploadFailed=false;
    try{
      for(let i=0;i<files.length;i++){
        setProgress({name:files[i].name,index:i+1,total:files.length,percent:0,stage:kind==='image'?'处理照片':'上传视频'});
        let file=kind==='image'?await preparePhoto(files[i]):files[i];
        if(kind==='video'){const type=file.type||(/\.mov$/i.test(file.name)?'video/quicktime':/\.webm$/i.test(file.name)?'video/webm':'video/mp4');if(!['video/mp4','video/quicktime','video/webm'].includes(type))throw Error('请选择 MP4、MOV 或 WebM 视频。');if(file.size>50*1024*1024)throw Error('每段视频最多 50 MB，请先剪短或压缩。');if(!file.type)file=new File([file],file.name,{type});}
        if(!alive.current)return;
        const result=await uploadFile(file,percent=>{if(alive.current)setProgress(old=>old?{...old,percent,stage:'上传中'}:old);},xhr=>{uploadRef.current=xhr;},lang);
        if(!alive.current)return;next=[...next,result];setMedia(next);photoAdded ||= kind==='image';
      }
    }catch(e){uploadFailed=true;if(alive.current)setLocalError(e.message);}
    finally{if(alive.current)setProgress(null);}
    if(alive.current&&!uploadFailed&&photoAdded&&autoGenerate&&capabilities.photoGeneration)await generate(next,true);
  };
  const move=(index,delta)=>setMedia(old=>{const next=[...old];[next[index],next[index+delta]]=[next[index+delta],next[index]];return next;});
  const commit=enabled=>save({...p,enabled,price_cents:price===''?null:Math.round(Number(price)*100),minimum_cents:minimum===''?null:Math.round(Number(minimum)*100),mediaIds:media.map(m=>m.id)});
  return <dialog ref={dialog} className="modal product-editor" onCancel={onClose}><div className="editor-header"><div><p className="eyebrow">{t("MINGLE'S CHOICE · 上新")}</p><h2>{t(p.id?'编辑商品':'从照片开始上新')}</h2></div><div className="editor-header-actions"><LanguageSwitch/><button className="icon-button" aria-label={t("关闭商品编辑")} onClick={onClose}><X size={23}/></button></div></div>
    <form onSubmit={e=>{e.preventDefault();commit(p.enabled);}}><div className="editor-scroll">
      <section className="editor-section media-section"><div className="editor-section-title"><span className="step-number">01</span><div><h3>{t("添加照片和视频")}</h3><p>{t("先选照片，商品标题和描述交给 AI 起草。")}</p></div><span className="media-count">{t(media.length)}/10</span></div>
        <div className="upload-actions"><button type="button" className="upload-tile primary" disabled={working||!capabilities.mediaUpload} onClick={()=>camera.current.click()}><Camera size={24}/><strong>{t("拍张照片")}</strong><span>{t("直接拍摄商品")}</span></button><button type="button" className="upload-tile" disabled={working||!capabilities.mediaUpload} onClick={()=>album.current.click()}><ImagePlus size={24}/><strong>{t("从相册选择")}</strong><span>{t("最多 8 张照片")}</span></button><button type="button" className="upload-tile" disabled={working||!capabilities.mediaUpload} onClick={()=>video.current.click()}><Video size={24}/><strong>{t("添加视频")}</strong><span>{t("每段最多 50 MB")}</span></button></div>
        <input ref={camera} className="visually-hidden" aria-label={t("拍摄商品照片")} type="file" accept="image/*" capture="environment" onChange={e=>selectFiles(e,'image')}/>
        <input ref={album} className="visually-hidden" aria-label={t("选择商品照片")} type="file" accept="image/*" multiple onChange={e=>selectFiles(e,'image')}/>
        <input ref={video} className="visually-hidden" aria-label={t("选择商品视频")} type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" multiple onChange={e=>selectFiles(e,'video')}/>
        {!capabilities.mediaUpload&&<p className="error">{t("上传服务尚未连接，请稍后重试。")}</p>}
        {progress&&<div className="upload-progress" role="status"><div><LoaderCircle size={16} className="spin"/><span>{t(progress.stage)} {t(progress.index)}/{t(progress.total)}</span><b>{t(progress.percent)}%</b></div><progress max="100" value={progress.percent}/><small>{t(progress.name)}</small></div>}
        {!!media.length&&<div className="media-grid">{media.map((m,index)=><div className="media-tile" key={m.id}>{m.kind==='image'?<img src={m.url} alt={t('商品照片 '+(index+1))}/>:<video src={m.url} controls playsInline preload="metadata"/>}<div className="media-tile-label">{t(index===0?'封面':m.kind==='video'?'视频':'照片 '+(index+1))}</div><div className="media-tile-actions"><button type="button" aria-label={t('向前移动媒体 '+(index+1))} disabled={working||index===0} onClick={()=>move(index,-1)}><ArrowUp size={14}/></button><button type="button" aria-label={t('向后移动媒体 '+(index+1))} disabled={working||index===media.length-1} onClick={()=>move(index,1)}><ArrowDown size={14}/></button><button type="button" aria-label={t('移除媒体 '+(index+1))} disabled={working} onClick={()=>{setMedia(media.filter(x=>x.id!==m.id));setDraft(null);}}><Trash2 size={14}/></button></div></div>)}</div>}
        <div className="ai-controls"><div><Sparkles size={18}/><strong>{t("看图写文案")}</strong><span className={'pill '+(capabilities.photoGeneration?'green':'')}>{t(capabilities.photoGeneration?'已启用':'待连接')}</span></div><label>{t("文案语言")}<select aria-label={t("文案语言")} value={language} disabled={working} onChange={e=>setLanguage(e.target.value)}><option value="en">{t("英文 · New Zealand English")}</option><option value="zh">{t("中文")}</option><option value="both">{t("中英双语")}</option></select></label><label className="check-label"><input type="checkbox" checked={autoGenerate} onChange={e=>setAutoGenerate(e.target.checked)}/>{t("添加照片后自动生成")}</label><button type="button" className="button secondary full" disabled={working||!media.some(m=>m.kind==='image')} onClick={()=>generate()}>{generating?<LoaderCircle size={17} className="spin"/>:<Sparkles size={17}/>} {t(generating?'正在看照片、写文案…':'根据照片生成标题和描述')}</button><p className="helper">{t(capabilities.photoGeneration?'识别时会将最多 3 张商品照片发送给 OpenAI 生成草稿，生成前可在相册中调整顺序。':'照片识别待启用，图片和视频仍可上传保存。')} {t(" 价格、库存和商品状况请自行确认。")}</p></div>
        {draft&&<div className="generation-result" role="status"><strong><Check size={17}/>{t(applied?'文案已填入，可继续编辑':'新文案已生成')}</strong>{!applied&&<><h4>{t(draft.title)}</h4><p>{t(draft.description)}</p><button type="button" className="text-button" onClick={()=>applyDraft(draft)}>{t("使用这份文案 ")}<ChevronRight size={15}/></button></>}{draft.reviewNotes.length>0&&<ul>{draft.reviewNotes.map((note,i)=><li key={i}>{t(note)}</li>)}</ul>}</div>}
      </section>
      <section className="editor-section"><div className="editor-section-title"><span className="step-number">02</span><div><h3>{t("检查商品文案")}</h3><p>{t("英文展示给客户，随时可以修改。")}</p></div></div><label>{t("商品标题")}<input autoComplete="off" required maxLength={120} value={p.name} placeholder={t("选好照片后自动填写，也可以手动输入")} onChange={e=>change('name',e.target.value)}/></label><label>{t("商品描述")}<textarea rows={5} maxLength={3000} value={p.description} placeholder={t("外观、用途，以及你已确认的商品信息…")} onChange={e=>change('description',e.target.value)}/></label><label>{t("商品分类")}<select aria-label={t("商品分类")} value={p.category} onChange={e=>change('category',e.target.value)}>{[...new Set([...categories,p.category])].map(c=><option key={c} value={c}>{t(c)}</option>)}</select></label></section>
      <section className="editor-section"><div className="editor-section-title"><span className="step-number">03</span><div><h3>{t("设置价格和库存")}</h3><p>{t("这两项由你决定，AI 不会代填。")}</p></div></div><div className="two"><label>{t("售价（NZD）")}<input inputMode="decimal" type="number" min=".01" step=".01" value={price} placeholder="0.00" onChange={e=>setPrice(e.target.value)}/></label><label>{t("总库存")}<input inputMode="numeric" type="number" min={p.reserved||0} max="1000000" required value={p.stock} onChange={e=>change('stock',Number(e.target.value))}/></label></div>
      <details className="advanced-pricing"><summary>{t("议价与多件优惠 ")}<ChevronRight size={16}/></summary><label className="check-label"><input type="checkbox" checked={p.negotiable} onChange={e=>change('negotiable',e.target.checked)}/>{t("允许按最低价规则自动议价")}</label><label>{t("最低可接受单价（NZD，仅店主可见）")}<input inputMode="decimal" type="number" min=".01" step=".01" required={p.negotiable} value={minimum} onChange={e=>setMinimum(e.target.value)}/></label><div className="two"><label>{t("优惠起购数量")}<input type="number" min="2" max="99" value={p.bulk_qty} onChange={e=>change('bulk_qty',Number(e.target.value))}/></label><label>{t("优惠幅度（%）")}<input type="number" min="0" max="80" value={p.bulk_percent} onChange={e=>change('bulk_percent',Number(e.target.value))}/></label></div></details>
      <details className="advanced-pricing"><summary>{t("已有图片网址（可选）")}<ChevronRight size={16}/></summary><label>{t("图片 HTTPS 地址")}<input type="url" value={p.image_url} placeholder="https://…" onChange={e=>change('image_url',e.target.value)}/></label></details></section>
      {(error||localError)&&<p className="error editor-error" role="alert">{t(localError||error)}</p>}
    </div><div className="editor-footer"><p>{t(media.length?'媒体已上传；保存后才会关联商品。':'先添加照片，或直接手动填写。')}</p><div>{!p.enabled&&<button type="submit" className="button secondary" disabled={working}>{t("保存草稿")}</button>}<button type={p.enabled?'submit':'button'} className="button" disabled={working} onClick={p.enabled?undefined:()=>{if(dialog.current.querySelector('form').reportValidity())commit(true);}}>{working?<LoaderCircle size={17} className="spin"/>:<Check size={17}/>} {t(p.enabled?'保存修改':'保存并上架')}</button></div></div></form>
  </dialog>;
}
