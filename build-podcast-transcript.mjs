import {readFileSync,writeFileSync} from 'node:fs';

const script=JSON.parse(readFileSync(new URL('./podcast-scripts/UX-001-v1.json',import.meta.url),'utf8'));
const escape=text=>String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const acts=script.turns.reduce((result,turn)=>{
  if(turn.act)result.push({name:turn.act,turns:[]});
  if(!result.length)throw new Error('First turn must name an act');
  result.at(-1).turns.push(turn);
  return result;
},[]);
const sections=acts.map(act=>`<section><h2>${escape(act.name)}</h2>${act.turns.map(turn=>`<p><strong>${turn.speaker==='alex'?'Alex':'Guide'}:</strong> ${escape(turn.text.replace(/\[[^\]]+\]/g,'').replace(/\s+/g,' ').trim())}</p>`).join('\n')}</section>`).join('\n');
const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f8f6ed"><title>UX-001 podcast transcript · UX Encyclopedia</title><style>
:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f8f6ed;color:#232622;font-family:Georgia,serif;font-size:18px;line-height:1.7}main{max-width:760px;margin:0 auto;padding:36px 24px 90px}a{color:#315443;text-underline-offset:3px}nav,.eyebrow,h2,strong{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}nav{font-size:14px}header{padding:54px 0 36px;border-bottom:1px solid #d7d2bd}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#a24732}h1{font-size:clamp(42px,7vw,72px);line-height:1.05;letter-spacing:-.04em;margin:16px 0}header p{color:#5d6259}section{padding:38px 0 24px;border-bottom:1px solid #e2dfd4}h2{font-size:28px;letter-spacing:-.03em}section p{margin:24px 0}section strong{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#a24732}footer{padding-top:28px;font-size:14px;color:#5d6259}
</style></head><body><main><nav><a href="course.html#UX-001">← Back to the lesson</a></nav><header><div class="eyebrow">UX Encyclopedia · Two-voice episode</div><h1>${escape(script.title)}</h1><p>Alex and a guide work through the same concepts and CarePath case taught in UX-001. This is an audio adaptation, not a replacement for the written lesson and its challenges.</p></header>${sections}<footer>${escape(script.editorial_note)}</footer></main></body></html>`;
writeFileSync(new URL('./podcast-UX-001.html',import.meta.url),html);
console.log(`Built transcript: ${script.turns.length} turns, ${acts.length} acts`);
