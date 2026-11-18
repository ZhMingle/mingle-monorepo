import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const root=resolve(process.argv[2]||'.');
const worker=(await import(pathToFileURL(resolve(root,'dist/server/index.js')))).default;
const port=Number(process.env.PREVIEW_PORT||5181);
const server=createServer(async(req,res)=>{
  try{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const result=await worker.fetch(new Request(`http://127.0.0.1:${port}${req.url}`,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}),{});
    res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
  }catch{res.writeHead(500);res.end('Preview failed');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Original Clarity app: http://127.0.0.1:${port}`));
