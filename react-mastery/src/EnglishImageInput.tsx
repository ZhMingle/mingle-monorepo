import {useEffect,useRef,useState} from 'react';
import {ImagePlus,LoaderCircle,X} from 'lucide-react';
import {useLanguage} from './language.tsx';
import {recognizeImage,validateOcrImage,ocrMaxPixels} from './english-ocr.ts';
import './english-image-input.css';

export default function EnglishImageInput({image,onImage,onText}:{image:File|null;onImage:(image:File|null)=>void;onText:(text:string)=>void}){
  const {language}=useLanguage();const say=(zh:string,en:string)=>language==='zh'?zh:en;
  const picker=useRef<HTMLInputElement>(null);
  const [preview,setPreview]=useState(''),[phase,setPhase]=useState<'idle'|'reading'|'ready'|'error'>('idle');
  const [progress,setProgress]=useState(0),[result,setResult]=useState(''),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    setResult('');setError('');setProgress(0);setPreview('');
    if(!image){setPhase('idle');return;}
    let active=true,url='',job:ReturnType<typeof recognizeImage>|undefined;
    setPhase('reading');
    void(async()=>{
      try{
        validateOcrImage(image);
        const bitmap=await createImageBitmap(image);
        const pixels=bitmap.width*bitmap.height;bitmap.close();
        if(!active)return;
        if(pixels>ocrMaxPixels)throw Error('图片尺寸太大，请裁剪后重试。 / Crop this large image before trying again.');
        url=URL.createObjectURL(image);setPreview(url);
        job=recognizeImage(image,value=>{if(active)setProgress(current=>Math.max(current,value));});
        const text=await job.promise;
        if(!active)return;
        if(!text)throw Error('没有识别到文字，请换一张清晰的图片。 / No text found. Try a clearer image.');
        setResult(text);setPhase('ready');
      }catch(cause){if(active){setPhase('error');setError((cause as Error).name==='InvalidStateError'?say('图片无法读取，请换一张图片。','This image could not be read. Try another image.'):(cause as Error).message);}}
    })();
    return()=>{active=false;job?.cancel();if(url)URL.revokeObjectURL(url);};
  },[image,attempt]);
  return <div className="english-image-input">
    <div className="english-image-tools"><button type="button" className="secondary" onClick={()=>picker.current?.click()}><ImagePlus size={16}/>{say('选择图片识字','Read text from image')}</button><small>{say('也可直接粘贴截图 · 英文 / 简体中文 · 图片不上传','Or paste a screenshot · English / Chinese · images stay in your browser')}</small><input ref={picker} hidden type="file" accept="image/png,image/jpeg,image/webp" aria-label={say('选择识别文字的图片','Choose an image to read')} onChange={event=>{const file=event.currentTarget.files?.[0];if(file)onImage(file);event.currentTarget.value='';}}/></div>
    {image&&<div className="english-image-preview">
      <div className="english-image-preview-heading"><strong>{say('图片文字识别','Text from image')}</strong><button type="button" className="icon-button" aria-label={say('取消图片识别','Cancel image recognition')} onClick={()=>onImage(null)}><X size={17}/></button></div>
      {preview&&<img src={preview} alt={say('待识别的图片','Image to read')}/>}
      {phase==='reading'&&<div role="status" className="english-image-progress"><LoaderCircle size={17} className="spin"/>{say('正在识别文字…','Reading text…')} {Math.round(progress*100)}%<progress max="1" value={progress}/></div>}
      {error&&<p role="alert" className="english-image-error">{error}</p>}
      {phase==='error'&&!result&&<button type="button" className="secondary" onClick={()=>setAttempt(value=>value+1)}>{say('重试识别','Retry recognition')}</button>}
      {phase==='ready'&&<><label className="english-image-result">{say('核对或修改识别结果','Check or edit the recognized text')}<textarea value={result} maxLength={20000} rows={4} onChange={event=>setResult(event.target.value)}/></label><button type="button" className="secondary" disabled={!result.trim()} onClick={()=>{try{onText(result);}catch(cause){setError((cause as Error).message);}}}>{say('将文字加入输入框','Add text to input')}</button></>}
    </div>}
  </div>;
}
