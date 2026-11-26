import {createWorker,OEM,PSM} from 'tesseract.js';

const scope=self as unknown as {location:Location;postMessage:(message:unknown)=>void;onmessage:((event:MessageEvent<{image:Blob}>)=>void)|null;close:()=>void};
scope.onmessage=async({data})=>{
  let engine:Awaited<ReturnType<typeof createWorker>>|undefined;
  try{
    const base=new URL('./',scope.location.href).href;
    engine=await createWorker(['eng','chi_sim'],OEM.LSTM_ONLY,{
      workerPath:base+'worker.min.js',workerBlobURL:false,
      corePath:base+'tesseract-core-lstm.wasm.js',langPath:base+'lang',cachePath:'clarity-ocr-v7',
      logger:message=>scope.postMessage({type:'progress',progress:message.status==='recognizing text'?.35+.65*message.progress:.05+.25*message.progress}),
      errorHandler:()=>{scope.postMessage({type:'error'});scope.close();}
    });
    await engine.setParameters({tessedit_pageseg_mode:PSM.AUTO});
    const result=await engine.recognize(data.image);
    scope.postMessage({type:'result',text:result.data.text});
  }catch{scope.postMessage({type:'error'});}
  finally{await engine?.terminate();scope.close();}
};
