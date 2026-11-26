export const ocrImageTypes=['image/png','image/jpeg','image/webp'];
export const ocrMaxBytes=10*1024*1024;
export const ocrMaxPixels=20_000_000;

export function clipboardImage(items:Iterable<Pick<DataTransferItem,'kind'|'type'|'getAsFile'>>):File|null{
  for(const item of items)if(item.kind==='file'&&item.type.startsWith('image/'))return item.getAsFile();
  return null;
}
export function validateOcrImage(image:Pick<File,'type'|'size'>){
  if(!ocrImageTypes.includes(image.type))throw Error('请使用 PNG、JPEG 或 WebP 图片。 / Use a PNG, JPEG or WebP image.');
  if(!image.size||image.size>ocrMaxBytes)throw Error('图片需小于 10 MB，且不能为空。 / Choose a nonempty image under 10 MB.');
}
export function appendOcrText(draft:string,recognized:string,maxLength=10000){
  const value=recognized.trim();
  if(!value)throw Error('没有识别到文字，请换一张清晰的图片。 / No text found. Try a clearer image.');
  const next=draft?draft+(draft.endsWith('\n')?'':'\n')+value:value;
  if(next.length>maxLength)throw Error('文字超过输入框上限，请缩短识别结果或现有输入。 / Shorten the recognized text or the current draft.');
  return next;
}

type OcrMessage={type:'progress';progress:number}|{type:'result';text:string}|{type:'error'};
type OcrWorker=Pick<Worker,'postMessage'|'terminate'|'onmessage'|'onerror'|'onmessageerror'>;
export function recognizeImage(image:Blob,onProgress:(progress:number)=>void,makeWorker:()=>OcrWorker=()=>new Worker('/ocr/v7/recognizer.js')){
  let worker:OcrWorker|undefined,settled=false,timer:ReturnType<typeof setTimeout>;
  let rejectJob:(error:Error)=>void=()=>{};
  const stop=()=>{clearTimeout(timer);worker?.terminate();};
  const cancel=()=>{if(settled)return;settled=true;stop();rejectJob(new DOMException('Cancelled','AbortError'));};
  const promise=new Promise<string>((resolve,reject)=>{
    rejectJob=reject;
    const fail=()=>{if(settled)return;settled=true;stop();reject(Error('图片识别未完成，请重试。 / Image recognition failed. Please retry.'));};
    timer=setTimeout(fail,120000);
    try{
      worker=makeWorker();
      worker.onmessage=({data}:MessageEvent<OcrMessage>)=>{
        if(settled)return;
        if(data?.type==='progress'&&Number.isFinite(data.progress)){onProgress(Math.max(0,Math.min(1,data.progress)));return;}
        if(data?.type==='result'&&typeof data.text==='string'){
          settled=true;stop();resolve(data.text.trim());
        }else if(data?.type==='error')fail();
      };
      worker.onerror=fail;worker.onmessageerror=fail;
      worker.postMessage({image});
    }catch{fail();}
  });
  return {promise,cancel};
}
