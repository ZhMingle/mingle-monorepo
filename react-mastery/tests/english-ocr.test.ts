import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appendOcrText,clipboardImage,ocrMaxBytes,recognizeImage,validateOcrImage} from '../src/english-ocr.ts';

test('image pastes are detected without intercepting ordinary text or HTML pastes',()=>{
  const image=new File(['png'],'clip.png',{type:'image/png'});
  const item=(kind:string,type:string,file:File|null)=>({kind,type,getAsFile:()=>file});
  assert.equal(clipboardImage([item('string','text/plain',null),item('file','image/png',image)]),image);
  assert.equal(clipboardImage([item('string','text/plain',null),item('string','text/html',null)]),null);
  assert.equal(clipboardImage([item('file','application/pdf',image)]),null);
});

test('supported images are bounded before recognition and SVG is not accepted',()=>{
  for(const type of ['image/png','image/jpeg','image/webp'])validateOcrImage({type,size:1024});
  for(const image of [{type:'image/svg+xml',size:10},{type:'image/png',size:0},{type:'image/png',size:ocrMaxBytes+1}])assert.throws(()=>validateOcrImage(image));
});

test('recognized text appends to the latest draft and never silently truncates either input',()=>{
  assert.equal(appendOcrText('newly typed','  manifest\nphysical symptoms\n'),'newly typed\nmanifest\nphysical symptoms');
  assert.equal(appendOcrText('draft\n','word'),'draft\nword');
  assert.equal(appendOcrText('',' text '),'text');
  assert.throws(()=>appendOcrText('draft','  '),/No text/);
  assert.throws(()=>appendOcrText('12345','67890',10),/Shorten/);
});

function fakeWorker(){
  let stopped=0;const sent:unknown[]=[];
  const worker={onmessage:null as Worker['onmessage'],onerror:null as Worker['onerror'],onmessageerror:null as Worker['onmessageerror'],postMessage:(value:unknown)=>sent.push(value),terminate:()=>{stopped++;}};
  return {worker,sent,stopped:()=>stopped,emit:(data:unknown)=>worker.onmessage?.call(worker as unknown as Worker,{data} as MessageEvent)};
}

test('OCR reports bounded progress, resolves real worker text and releases the worker',async()=>{
  const fake=fakeWorker(),progress:number[]=[];const image=new Blob(['synthetic']);
  const job=recognizeImage(image,value=>progress.push(value),()=>fake.worker);
  assert.deepEqual(fake.sent,[{image}]);fake.emit({type:'progress',progress:1.5});fake.emit({type:'result',text:'  hello\nworld  '});
  assert.equal(await job.promise,'hello\nworld');assert.deepEqual(progress,[1]);assert.equal(fake.stopped(),1);
});

test('cancellation rejects immediately and late worker messages cannot restore results',async()=>{
  const fake=fakeWorker(),progress:number[]=[];const job=recognizeImage(new Blob(['x']),value=>progress.push(value),()=>fake.worker);
  job.cancel();fake.emit({type:'progress',progress:.5});fake.emit({type:'result',text:'late text'});
  await assert.rejects(job.promise,{name:'AbortError'});assert.deepEqual(progress,[]);assert.equal(fake.stopped(),1);
});

test('worker failures and timeouts are explicit errors with no placeholder OCR text',async(t)=>{
  const failed=fakeWorker();const failure=recognizeImage(new Blob(['x']),()=>{},()=>failed.worker);
  failed.emit({type:'error'});await assert.rejects(failure.promise,/recognition failed/);assert.equal(failed.stopped(),1);
  t.mock.timers.enable({apis:['setTimeout']});
  const delayed=fakeWorker();const timeout=recognizeImage(new Blob(['x']),()=>{},()=>delayed.worker);
  t.mock.timers.tick(120001);await assert.rejects(timeout.promise,/recognition failed/);assert.equal(delayed.stopped(),1);
});
