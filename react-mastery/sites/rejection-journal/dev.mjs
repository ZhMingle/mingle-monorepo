import './build.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const files=new Map([['/','index.html'],['/index.html','index.html'],['/styles.css','styles.css'],['/app.mjs','app.mjs'],['/model.mjs','model.mjs']]);
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',mjs:'text/javascript; charset=utf-8'};
createServer(async(req,res)=>{
  const file=files.get(new URL(req.url,'http://localhost').pathname);
  if(!file){res.writeHead(404).end();return;}
  try{
    const body=await readFile(new URL('./dist/'+file,import.meta.url));
    res.writeHead(200,{'Content-Type':types[file.split('.').at(-1)],'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});res.end(body);
  }catch{res.writeHead(500).end('Could not load the page.');}
}).listen(4330,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4330/'));
