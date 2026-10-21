// Local-only static preview with byte-range support for podcast seeking.
import {createServer} from 'node:http';
import {createReadStream,statSync} from 'node:fs';
import {resolve,sep,extname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('.',import.meta.url)));
const port=Number(process.env.UX_PREVIEW_PORT||4176);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.m4a':'audio/mp4','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};

createServer((request,response)=>{
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405,{Allow:'GET, HEAD'}).end();return}
  let pathname;
  try{pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname)}catch{response.writeHead(400).end();return}
  let file=resolve(root,`.${pathname}`);
  if(file!==root&&!file.startsWith(root+sep)){response.writeHead(403).end();return}
  try{if(statSync(file).isDirectory())file=join(file,'index.html')}catch{response.writeHead(404).end();return}
  let size;
  try{const stat=statSync(file);if(!stat.isFile())throw Error();size=stat.size}catch{response.writeHead(404).end();return}
  const headers={'Content-Type':types[extname(file).toLowerCase()]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-store'};
  let start=0,end=size-1,status=200;
  const range=request.headers.range;
  if(range){
    const match=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(!match||(!match[1]&&!match[2])){response.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return}
    if(match[1]){start=Number(match[1]);end=match[2]?Number(match[2]):end}
    else{start=Math.max(0,size-Number(match[2]))}
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start){response.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return}
    end=Math.min(end,size-1);status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length']=String(end-start+1);
  response.writeHead(status,headers);
  if(request.method==='HEAD'){response.end();return}
  createReadStream(file,{start,end}).pipe(response);
}).listen(port,'127.0.0.1',()=>console.log(`Podcast preview: http://127.0.0.1:${port}/course-podcast-v1.html`));
