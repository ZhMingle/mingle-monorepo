import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/reasoning.js':'reasoning.js'};
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8'};
createServer(async(req,res)=>{const name=files[new URL(req.url,'http://localhost').pathname];if(!name){res.writeHead(404);res.end('Not found');return}try{const data=await readFile(fileURLToPath(new URL('dist/'+name,import.meta.url)));res.writeHead(200,{'Content-Type':types[name.split('.').pop()],'Cache-Control':'no-store'});res.end(data)}catch{res.writeHead(500);res.end('Unable to load page')}}).listen(4331,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4331'));
