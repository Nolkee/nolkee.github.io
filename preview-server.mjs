import http from 'node:http';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,extname} from 'node:path';
const root=resolve(process.argv[2] || '.'),port=Number(process.argv[3] || 8871);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.m4a':'audio/mp4'};
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');let path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
 if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
 if((await stat(path)).isDirectory())path=resolve(path,'index.html');
 const {size}=await stat(path),headers={'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
 const match=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
 if(match){const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),size-1):size-1;
 if(start>=size||start>end){res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}
 res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});if(req.method==='HEAD')res.end();else createReadStream(path,{start,end}).pipe(res);
 }else{res.writeHead(200,{...headers,'Content-Length':size});if(req.method==='HEAD')res.end();else createReadStream(path).pipe(res);}
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
