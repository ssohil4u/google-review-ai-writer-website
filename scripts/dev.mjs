import http from 'node:http';
import {parseEnv} from 'node:util';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {polish} from '../worker.mjs';
const root=new URL('../public/',import.meta.url);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:8787');if(url.pathname==='/api/polish'){let body='';for await(const chunk of req){body+=chunk;if(body.length>16000){res.writeHead(413);res.end();return;}}const request=new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body}:{})});let secrets={};try{secrets=parseEnv(await readFile(new URL('../.dev.vars',import.meta.url),'utf8'));}catch{}const response=await polish(request,{...process.env,...secrets});res.writeHead(response.status,Object.fromEntries(response.headers));res.flushHeaders();if(response.body){const reader=response.body.getReader();res.on('close',()=>{reader.cancel().catch(()=>{});});try{while(!res.destroyed){const {done,value}=await reader.read();if(done)break;res.write(value);}}finally{reader.releaseLock();}}res.end();return;}const path=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));const file=new URL(path,root);if(!file.href.startsWith(root.href))throw Error();const data=await readFile(fileURLToPath(file));res.writeHead(200,{'Content-Type':types['.'+path.split('.').pop()]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
server.listen(8787,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:8787'));
