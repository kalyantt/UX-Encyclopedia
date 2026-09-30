const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inline = value => esc(value).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`(.+?)`/g,'<code>$1</code>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
function markdown(md) {
  const lines=md.split(/\r?\n/);let out='',list='',i=0;
  const closeList=()=>{if(list){out+='</'+list+'>';list=''}};
  const cells=line=>line.replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
  while(i<lines.length){
    const l=lines[i].trim();
    if(!l){closeList();i++;continue}
    if(l==='---'||l.startsWith('# ')){i++;continue}
    const h=l.match(/^(#{2,3})\s+(.+)/);
    if(h){closeList();out+='<h3>'+inline(h[2])+'</h3>';i++;continue}
    if(/^\|/.test(l)&&/^\|?\s*:?-{3,}/.test((lines[i+1]||'').trim().replace(/^\|/,''))){
      closeList();const heads=cells(l);i+=2;const rows=[];while(i<lines.length&&/^\|/.test(lines[i].trim())){rows.push(cells(lines[i].trim()));i++}
      out+='<div class="table-wrap"><table><thead><tr>'+heads.map(x=>'<th scope="col">'+inline(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+inline(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';continue
    }
    if(l.startsWith('>')){closeList();const quote=[];while(i<lines.length&&lines[i].trim().startsWith('>')){quote.push(lines[i].trim().replace(/^>\s?/,''));i++}out+='<blockquote>'+markdown(quote.join('\n'))+'</blockquote>';continue}
    const li=l.match(/^[-*]\s+(.+)/),oi=l.match(/^\d+\.\s+(.+)/);
    if(li||oi){const want=oi?'ol':'ul';if(list&&list!==want)closeList();if(list!==want){out+='<'+want+'>';list=want}out+='<li>'+inline((li||oi)[1])+'</li>';i++;continue}
    closeList();const para=[l];i++;while(i<lines.length){const next=lines[i].trim();if(!next||/^(#{1,3})\s+/.test(next)||/^[-*]\s+/.test(next)||/^\d+\.\s+/.test(next)||next.startsWith('>')||next.startsWith('|'))break;para.push(next);i++}out+='<p>'+inline(para.join(' '))+'</p>';
  }
  closeList();return out;
}

let library,currentId;
const nav=document.querySelector('#nav'),page=document.querySelector('#page');
const storageKey='ux-encyclopedia-practice-v1';
let saved={notes:{},complete:{},checks:{}},storageAvailable=true;
try{const stored=JSON.parse(localStorage.getItem(storageKey)||'null');if(stored&&typeof stored==='object')for(const key of ['notes','complete','checks'])if(stored[key]&&typeof stored[key]==='object')saved[key]=stored[key]}catch{storageAvailable=false}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(saved));return true}catch{storageAvailable=false;return false}}
function find(id){for(const[mid,m]of Object.entries(library.index)){const pos=m.lessons.findIndex(l=>l[0]===id);if(pos!==-1)return{mid,m,pos,id,title:m.lessons[pos][1]}}return null}
function allLessons(){return Object.values(library.index).flatMap(m=>m.lessons)}
function closeMobile(){document.querySelector('#rail').classList.remove('mobile-open');document.querySelector('#menu-toggle').setAttribute('aria-expanded','false');document.querySelector('#menu-toggle').textContent='Course contents'}
document.querySelector('#menu-toggle').onclick=()=>{const open=document.querySelector('#rail').classList.toggle('mobile-open');document.querySelector('#menu-toggle').setAttribute('aria-expanded',String(open));document.querySelector('#menu-toggle').textContent=open?'Close contents':'Course contents'};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('#rail').classList.contains('mobile-open')){closeMobile();document.querySelector('#menu-toggle').focus()}});
function exclusive(container,selector){container.querySelectorAll(selector).forEach(detail=>{detail.addEventListener('toggle',()=>detail.querySelector(':scope > summary').setAttribute('aria-expanded',String(detail.open)));detail.querySelector(':scope > summary').addEventListener('click',()=>{if(!detail.open)container.querySelectorAll(selector).forEach(other=>{if(other!==detail)other.open=false})})})}
function updateProgress(){const count=allLessons().filter(([id])=>saved.complete[id]).length;document.querySelector('#progress-label').textContent=count+' of 204 lesson challenges practised';document.querySelector('#progress-bar').style.width=(count/204*100)+'%'}
function renderNav(mid){
  const position=nav.scrollTop;
  nav.innerHTML=Object.entries(library.index).map(([key,m],i)=>`<details class="nav-module" name="chapters" ${key===mid?'open':''}><summary aria-expanded="${key===mid}"><span class="module-number">${String(i+1).padStart(2,'0')}</span><span class="module-name">${esc(m.name)}<small>${m.lessons.length} lessons</small></span><span class="chevron" aria-hidden="true"></span></summary><div class="lesson-links">${m.lessons.map(([id,title])=>`<a class="lesson-link" href="#${id}" ${currentId===id?'aria-current="page"':''}><span class="lesson-dot" aria-hidden="true">${saved.complete[id]?'✓':'○'}</span><span>${esc(title)}</span></a>`).join('')}<a class="lesson-link chapter-link" href="#${key}-challenge" ${currentId===key+'-challenge'?'aria-current="page"':''}><span class="lesson-dot" aria-hidden="true">${saved.complete[key+'-challenge']?'✓':'↗'}</span><span>Chapter challenge</span></a></div></details>`).join('');
  exclusive(nav,'.nav-module');nav.scrollTop=position;updateProgress();
}
function section(title,body,number,{open=false,challenge=false,id=''}={}){return `<details class="reading-section ${challenge?'challenge-section':''}" name="lesson-sections" ${open?'open':''} ${id?`id="${id}"`:''}><summary aria-expanded="${open}"><span class="section-number">${challenge?'✎':String(number).padStart(2,'0')}</span><h2 class="section-title">${esc(title)}</h2><span class="chevron" aria-hidden="true"></span></summary><div class="section-body">${body}</div></details>`}
function answer(id,field,label){const key=id+':'+field;return `<label for="answer-${field}">${esc(label)}</label><textarea class="answer" id="answer-${field}" data-note="${esc(key)}" placeholder="Write it in your own words…">${esc(saved.notes[key]||'')}</textarea><div class="note-status" id="status-${field}" role="status">${storageAvailable?'Saved on this device as you type.':'Browser storage is unavailable. Copy your notes before leaving.'}</div>`}
function completion(id){return `<div class="challenge-actions"><button class="button" id="complete" aria-pressed="${!!saved.complete[id]}">${saved.complete[id]?'✓ Practised · mark unfinished':'Mark as practised'}</button><button class="button secondary" id="download-notes">Download my notes</button></div><div class="note-status" id="completion-status" role="status">Self-assessed practice. This is not a graded result.</div>`}
function lessonChallenge(id,lesson){
  const body=`<div class="challenge-kicker">01 · Recall</div><h3>Close the lesson. Keep the idea.</h3><p>${esc(lesson.recall)}</p>${answer(id,'recall','Your explanation')}<details class="feedback"><summary>Compare with the lesson</summary><div class="prose"><p>Check whether your explanation connects the situation, the mechanism, and the design decision. There can be more than one defensible answer.</p>${lesson.guidance.map(s=>'<h3>'+esc(s.title)+'</h3>'+markdown(s.body)).join('')}</div></details><div class="task-block"><div class="challenge-kicker">02 · Apply</div><h3>Make a design decision.</h3><div class="prose">${markdown(lesson.practice)}</div>${answer(id,'application','Your decision, sketch notes, and reasoning')}<details class="feedback"><summary>Review your reasoning</summary><div class="prose"><p>Point to the part of your answer that responds to the task. Explain why it should help, what could still fail, and what evidence would make you change it. Compare it with the relevant example in the lesson; matching its wording is not the goal.</p></div></details></div><div class="task-block"><div class="challenge-kicker">03 · Notice</div><h3>Train your UX eye.</h3><div class="prose">${markdown(lesson.observe)}</div></div>${completion(id)}`;
  return section('Your lesson challenge',body,0,{challenge:true,id:'lesson-challenge'});
}
function renderLesson(id){
  const x=find(id),lesson=library.reading[id];if(!x||!lesson)return false;
  currentId=id;const all=allLessons(),at=all.findIndex(l=>l[0]===id),words=library.chapters[id].split(/\s+/).length;
  document.title=x.title+' · UX Encyclopedia';document.querySelector('#breadcrumb').textContent='Chapter '+Number(x.mid.slice(1))+' / '+x.m.name;document.querySelector('#reading-status').textContent='Lesson '+(x.pos+1)+' of '+x.m.lessons.length;
  const previous=x.pos?x.m.lessons[x.pos-1]:at?all[at-1]:null;
  const next=x.pos<x.m.lessons.length-1?x.m.lessons[x.pos+1]:[x.mid+'-challenge','Chapter challenge'];
  page.innerHTML=`<div class="lesson"><header class="lesson-head"><div class="eyebrow">The UX Encyclopedia · ${id}</div><h1>${esc(x.title)}</h1><div class="lesson-meta"><span>${Math.max(3,Math.round(words/210))} min read</span><span>·</span><span>${esc(library.modules[x.mid].title)}</span></div></header><div class="opening">${markdown(lesson.opening)}<div class="fiction-note">A fictional teaching case. Follow the reasoning and test it in your own work.</div></div><div class="section-intro"><strong>Read at your own pace</strong><span>One section open at a time</span></div><div class="reading-sections">${lesson.sections.map((s,i)=>section(s.label,`<div class="prose">${markdown(s.body)}</div>`,i+1,{open:i===0})).join('')}${lessonChallenge(id,lesson)}${section('Sources & further reading',`<div class="prose">${markdown(lesson.refs)}</div>`,lesson.sections.length+2)}</div>${lesson.thread?`<details class="continuity"><summary>How this connects to the course</summary><div class="prose">${markdown(lesson.thread)}</div></details>`:''}<nav class="footer-nav" aria-label="Lesson navigation">${previous?`<a href="#${previous[0]}"><small>← Previous lesson</small><strong>${esc(previous[1])}</strong></a>`:''}<a href="#${next[0]}"><small>${next[0].endsWith('challenge')?'Finish this chapter':'Next lesson'} →</small><strong>${esc(next[1])}</strong></a></nav></div>`;
  bindPage(id);renderNav(x.mid);return true;
}
function renderChapter(mid){
  const module=library.modules[mid],m=library.index[mid];if(!module||!m)return false;
  const id=mid+'-challenge';currentId=id;const ids=Object.keys(library.index),next=ids[ids.indexOf(mid)+1];
  document.title=module.title+' · Chapter challenge';document.querySelector('#breadcrumb').textContent='Chapter '+Number(mid.slice(1))+' / '+m.name;document.querySelector('#reading-status').textContent='Put the chapter to work';
  const deliver=`<div class="prose"><ol>${module.deliver.map(t=>'<li>'+esc(t)+'</li>').join('')}</ol></div>${answer(id,'application','Your response or a link to your working notes')}<details class="feedback"><summary>Check your work</summary><p>Use these criteria to review the reasoning. They are a guide, not an automatic score.</p>${module.review.map((t,i)=>`<div class="review-check"><input type="checkbox" id="review-${i}" data-check="${id}:${i}" ${saved.checks[id+':'+i]?'checked':''}><label for="review-${i}">${esc(t)}</label></div>`).join('')}</details><div class="twist"><strong>Now change one condition</strong>${esc(module.twist)}</div>${answer(id,'revision','What would you change, and why?')}${completion(id)}`;
  page.innerHTML=`<div class="lesson"><header class="lesson-head"><div class="eyebrow">Chapter ${Number(mid.slice(1))} · The challenge</div><h1>${esc(module.title)}</h1><div class="lesson-meta"><span>Bring ${m.lessons.length} lessons together</span><span>·</span><span>Work at your own pace</span></div></header><div class="opening"><p>${esc(module.story)}</p></div><div class="chapter-brief">${esc(module.challenge)}</div>${section('Your brief & working notes',deliver,1,{open:true,challenge:true})}${section('Revisit a lesson',`<div class="chapter-reading">${m.lessons.map(([lid,t])=>`<a href="#${lid}">${esc(t)}</a>`).join('')}</div>`,2)}<nav class="footer-nav" aria-label="Chapter navigation"><a href="#${m.lessons.at(-1)[0]}"><small>← Back to the last lesson</small><strong>${esc(m.lessons.at(-1)[1])}</strong></a>${next?`<a href="#${library.index[next].lessons[0][0]}"><small>Next chapter →</small><strong>${esc(library.index[next].name)}</strong></a>`:`<a href="index.html"><small>Course home →</small><strong>Keep practising in real products</strong></a>`}</nav></div>`;
  bindPage(id);renderNav(mid);return true;
}
function bindPage(id){
  exclusive(page,'.reading-section');
  page.querySelectorAll('[data-note]').forEach(input=>input.addEventListener('input',()=>{saved.notes[input.dataset.note]=input.value;const ok=persist();document.getElementById('status-'+input.id.replace('answer-','')).textContent=ok?'Saved on this device.':'Could not save. Download your notes before leaving.'}));
  page.querySelectorAll('[data-check]').forEach(input=>input.addEventListener('change',()=>{saved.checks[input.dataset.check]=input.checked;persist()}));
  page.querySelector('#complete').onclick=e=>{saved.complete[id]=!saved.complete[id];const ok=persist();e.currentTarget.textContent=saved.complete[id]?'✓ Practised · mark unfinished':'Mark as practised';e.currentTarget.setAttribute('aria-pressed',String(!!saved.complete[id]));document.querySelector('#completion-status').textContent=ok?'Progress saved on this device.':'Progress could not be saved in this browser.';renderNav(id.startsWith('M')?id.slice(0,3):find(id).mid)};
  page.querySelector('#download-notes').onclick=()=>{const notes=Object.entries(saved.notes).filter(([key])=>key.startsWith(id+':'));const text=[document.title,...notes.map(([key,value])=>'\n'+key.split(':')[1].toUpperCase()+'\n'+value)].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=id+'-practice.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
}
function route(){
  const id=location.hash.slice(1)||'UX-001';
  if(id==='page'){page.focus();return}
  const valid=/^M\d{2}-challenge$/.test(id)?renderChapter(id.slice(0,3)):renderLesson(id);
  if(!valid){history.replaceState(null,'','#UX-001');renderLesson('UX-001')}
  closeMobile();window.scrollTo({top:0,behavior:'instant'});page.focus({preventScroll:true});
}
window.addEventListener('hashchange',()=>{if(library)route()});
async function start(){const bytes=Uint8Array.from(atob(window.course204Gzip),c=>c.charCodeAt(0));library=JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text());route()}
start().catch(error=>{page.innerHTML='<h1>The lesson could not open.</h1><p>Please reload the page in a current browser.</p><button class="button" onclick="location.reload()">Try again</button>';console.error(error)});
