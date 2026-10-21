import {readFileSync,writeFileSync} from 'node:fs';
import {basename} from 'node:path';

const source=process.argv[2];
if(!source)throw new Error('Pass a podcast script JSON path');
const script=JSON.parse(readFileSync(source,'utf8'));
const id=script.lesson;
if(!/^UX-\d{3}$/.test(id))throw new Error('Invalid lesson ID');
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const content=script.turns.map(turn=>`${turn.act?`<h2>${esc(turn.act)}</h2>`:''}<p><strong>${turn.speaker==='host'?'Host':'Guide'}:</strong> ${esc(turn.text)}</p>`).join('\n');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(script.title)} · Podcast transcript</title><style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f8f6ed;color:#232622;font:18px/1.7 Georgia,serif}main{max-width:760px;margin:auto;padding:36px 24px 90px}a{color:#315443;text-underline-offset:3px}nav,h2,strong,.eyebrow{font-family:system-ui,sans-serif}nav{font-size:14px}header{padding:50px 0 30px;border-bottom:1px solid #d7d2bd}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#a24732}h1{font-size:clamp(40px,7vw,70px);line-height:1.06;margin:16px 0}h2{font-size:26px;margin-top:50px}p{margin:22px 0}p strong{font-size:13px;letter-spacing:.07em;text-transform:uppercase;color:#a24732}footer{border-top:1px solid #d7d2bd;margin-top:50px;padding-top:20px;font-size:14px;color:#5d6259}</style></head><body><main><nav><a href="course-podcast-v1.html#${id}">← Back to lesson</a></nav><header><div class="eyebrow">UX Encyclopedia · Two-voice episode</div><h1>${esc(script.title)}</h1><p>A conversational adaptation of the revised lesson. Read the lesson for the full detail and challenges.</p></header>${content}<footer>${esc(script.editorial_note||'')}</footer></main></body></html>`;
const destination=new URL(`./podcast-${id}-editorial-v1.html`,import.meta.url);
writeFileSync(destination,html);
console.log(`Built ${basename(destination.pathname)}`);
