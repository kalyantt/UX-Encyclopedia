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
function exclusive(container,selector){
  const details=[...container.querySelectorAll(selector)],desired=new WeakMap();
  let frame=0,release=()=>{};
  details.forEach(detail=>{
    detail.removeAttribute('name');desired.set(detail,detail.open);
    detail.querySelector(':scope > summary').addEventListener('click',event=>{
      event.preventDefault();cancelAnimationFrame(frame);release();
      const summary=detail.querySelector(':scope > summary');
      const rect=summary.getBoundingClientRect();
      if(container!==nav&&(rect.bottom<70||rect.top>innerHeight-24))summary.scrollIntoView({block:'center',behavior:'instant'});
      const anchorTop=summary.getBoundingClientRect().top;
      const opening=!desired.get(detail);
      const before=new Map(details.map(item=>[item,item.getBoundingClientRect().height]));
      if(opening)details.forEach(item=>desired.set(item,false));
      desired.set(detail,opening);
      const tracks=details.filter(item=>item.open!==desired.get(item)||item.style.height).map(item=>{
        const head=item.querySelector(':scope > summary'),body=head.nextElementSibling;
        const from=before.get(item),fromOpacity=body?Number(getComputedStyle(body).opacity):1;
        const open=desired.get(item);
        item.style.height='';item.open=true;
        const border=parseFloat(getComputedStyle(item).borderTopWidth)+parseFloat(getComputedStyle(item).borderBottomWidth);
        const to=open?item.getBoundingClientRect().height:head.getBoundingClientRect().height+border;
        head.setAttribute('aria-expanded',String(open));
        item.style.height=from+'px';item.style.overflow='clip';
        return {item,body,open,from,to,fromOpacity};
      });
      let anchor=true;
      const stopAnchoring=()=>{anchor=false};
      const scroller=container===nav?nav:window;
      scroller.addEventListener('wheel',stopAnchoring,{passive:true});
      scroller.addEventListener('touchmove',stopAnchoring,{passive:true});
      release=()=>{scroller.removeEventListener('wheel',stopAnchoring);scroller.removeEventListener('touchmove',stopAnchoring)};
      const pin=()=>{if(anchor&&summary.isConnected){const delta=summary.getBoundingClientRect().top-anchorTop;if(Math.abs(delta)>.1){if(container===nav)nav.scrollTop+=delta;else window.scrollBy({top:delta,behavior:'instant'})}}};
      const finish=()=>{tracks.forEach(({item,body,open})=>{item.open=open;item.style.height='';item.style.overflow='';if(body)body.style.opacity=''});pin();release()};
      if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return}
      const start=performance.now(),duration=560,normalizer=1-9*Math.exp(-8);
      const tick=now=>{
        if(!summary.isConnected){release();return}
        const progress=Math.min(1,(now-start)/duration),t=progress*8;
        const eased=(1-(1+t)*Math.exp(-t))/normalizer;
        tracks.forEach(({item,body,open,from,to,fromOpacity})=>{
          item.style.height=(from+(to-from)*eased)+'px';
          if(body)body.style.opacity=String(fromOpacity+((open?1:0)-fromOpacity)*eased);
        });
        pin();
        if(progress<1)frame=requestAnimationFrame(tick);else finish();
      };
      frame=requestAnimationFrame(tick);
    });
  });
}
function quizComplete(id){return library.quizzes[id]?.every((_,i)=>Object.hasOwn(saved.checks,`quiz-v2:${id}:${id}:${i}`))}
function updateProgress(){const count=allLessons().filter(([id])=>quizComplete(id)).length;document.querySelector('#progress-label').textContent=count+' of 204 lesson quizzes completed';document.querySelector('#progress-bar').style.width=(count/204*100)+'%'}
function renderNav(mid){
  const position=nav.scrollTop;
  nav.innerHTML=Object.entries(library.index).map(([key,m],i)=>`<details class="nav-module" name="chapters" ${key===mid?'open':''}><summary aria-expanded="${key===mid}"><span class="module-number">${String(i+1).padStart(2,'0')}</span><span class="module-name">${esc(m.name)}<small>${m.lessons.length} lessons</small></span><span class="chevron" aria-hidden="true"></span></summary><div class="lesson-links">${m.lessons.map(([id,title])=>`<a class="lesson-link" href="#${id}" ${currentId===id?'aria-current="page"':''}><span class="lesson-dot" aria-hidden="true">${quizComplete(id)?'✓':'○'}</span><span>${esc(title)}</span></a>`).join('')}<a class="lesson-link chapter-link" href="#${key}-challenge" ${currentId===key+'-challenge'?'aria-current="page"':''}><span class="lesson-dot" aria-hidden="true">${saved.complete[key+'-challenge']?'✓':'↗'}</span><span>Chapter challenge</span></a></div></details>`).join('');
  exclusive(nav,'.nav-module');nav.scrollTop=position;updateProgress();
}
function section(title,body,number,{open=false,challenge=false,id=''}={}){return `<details class="reading-section ${challenge?'challenge-section':''}" name="lesson-sections" ${open?'open':''} ${id?`id="${id}"`:''}><summary aria-expanded="${open}"><span class="section-number">${challenge?'✎':String(number).padStart(2,'0')}</span><h2 class="section-title">${esc(title)}</h2><span class="chevron" aria-hidden="true"></span></summary><div class="section-body">${body}</div></details>`}
function lessonChallenge(id,lesson){
  const body=`<div class="challenge-kicker">Four questions · check your understanding</div><p>One scenario and three concept comparisons. Choose the strongest answer. Your first-try score stays separate from practice retries.</p><p class="quiz-score" role="status"></p>${library.quizzes[id].map((_,i)=>quiz(id,id,i+1,i)).join('')}<details class="feedback"><summary>Optional: try it in a real product</summary><div class="prose">${markdown(lesson.practice)}<h3>Train your UX eye</h3>${markdown(lesson.observe)}</div></details>`;
  return section('Your lesson challenge',body,0,{challenge:true,id:'lesson-challenge'});
}
function quiz(lessonId,scope,number=1,question=0){
  const q=library.quizzes[lessonId][question],key=scope+':'+lessonId+':'+question;
  return `<form class="quiz" data-quiz="${lessonId}" data-question="${question}" data-scope="${scope}"><fieldset><legend><span class="challenge-kicker">Question ${number}</span>${esc(q.prompt)}</legend><div class="quiz-options">${q.options.map((option,i)=>`<label class="quiz-option"><input type="radio" name="${key}" value="${i}" required><span>${esc(option)}</span></label>`).join('')}</div></fieldset><button class="button quiz-submit" type="submit">Check answer</button><div class="quiz-result" role="status" aria-live="polite"></div><button class="button secondary quiz-retry" type="button" hidden>Try again</button></form>`;
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
  const reviewLessons=Array.from({length:6},(_,i)=>m.lessons[Math.floor(i*(m.lessons.length-1)/5)]);
  const deliver=`<p>Six questions revisiting this chapter. Select one answer for each, then check your reasoning.</p><p class="quiz-score" role="status"></p>${reviewLessons.map(([lid],i)=>quiz(lid,id,i+1)).join('')}`;
  page.innerHTML=`<div class="lesson"><header class="lesson-head"><div class="eyebrow">Chapter ${Number(mid.slice(1))} · The challenge</div><h1>${esc(module.title)}</h1><div class="lesson-meta"><span>Review the chapter</span><span>·</span><span>Six multiple-choice questions</span></div></header><div class="opening"><p>${esc(module.story)}</p></div>${section('Check your understanding',deliver,1,{open:true,challenge:true})}${section('Revisit a lesson',`<div class="chapter-reading">${m.lessons.map(([lid,t])=>`<a href="#${lid}">${esc(t)}</a>`).join('')}</div>`,2)}<nav class="footer-nav" aria-label="Chapter navigation"><a href="#${m.lessons.at(-1)[0]}"><small>← Back to the last lesson</small><strong>${esc(m.lessons.at(-1)[1])}</strong></a>${next?`<a href="#${library.index[next].lessons[0][0]}"><small>Next chapter →</small><strong>${esc(library.index[next].name)}</strong></a>`:`<a href="index.html"><small>Course home →</small><strong>Keep practising in real products</strong></a>`}</nav></div>`;
  bindPage(id);renderNav(mid);return true;
}
function bindPage(id){
  exclusive(page,'.reading-section');
  const forms=[...page.querySelectorAll('.quiz')];
  const keyFor=form=>`quiz-v2:${form.dataset.scope}:${form.dataset.quiz}:${form.dataset.question}`;
  function refreshScore(){
    const answered=forms.filter(form=>Object.hasOwn(saved.checks,keyFor(form))).length;
    const passed=forms.filter(form=>saved.checks[keyFor(form)]===true).length;
    const first=forms.filter(form=>saved.checks[keyFor(form)+':first']===true).length;
    const score=page.querySelector('.quiz-score');if(score)score.textContent=`${answered} of ${forms.length} answered · ${passed} correct now`+(answered===forms.length?` · First try: ${first}/${forms.length} (${Math.round(first/forms.length*100)}%). A practice check, not a certification.`:'');
    if(answered===forms.length){saved.complete[id]=true;persist()}
    updateProgress();
    const dot=nav.querySelector(`a[href="#${id}"] .lesson-dot`);if(dot&&answered===forms.length)dot.textContent='✓';
  }
  forms.forEach(form=>{
    const q=library.quizzes[form.dataset.quiz][Number(form.dataset.question)],key=keyFor(form);
    if(Object.hasOwn(saved.checks,key))form.querySelector('.quiz-result').textContent=saved.checks[key]?'Previously answered correctly. You can practise again.':'Previously answered incorrectly. Try again after reviewing the lesson.';
    form.addEventListener('submit',event=>{
      event.preventDefault();const selected=form.querySelector('input:checked');if(!selected)return;
      const correct=Number(selected.value)===q.correct;
      form.querySelectorAll('input').forEach(input=>input.disabled=true);
      selected.closest('label').classList.add(correct?'is-correct':'is-incorrect');
      form.querySelector('.quiz-result').innerHTML=`<strong>${correct?'That’s right.':'Not quite.'}</strong><p>${esc(q.explanation)}</p>${correct?'':`<p><strong>Best answer:</strong> ${esc(q.options[q.correct])}</p>`}`;
      form.querySelector('.quiz-submit').hidden=true;form.querySelector('.quiz-retry').hidden=false;
      form.querySelector('.quiz-result').setAttribute('tabindex','-1');form.querySelector('.quiz-result').focus({preventScroll:true});
      if(!Object.hasOwn(saved.checks,key+':first'))saved.checks[key+':first']=correct;
      saved.checks[key]=correct;const ok=persist();refreshScore();
      if(!ok)form.querySelector('.quiz-result').insertAdjacentHTML('beforeend','<p>Progress could not be saved in this browser.</p>');
    });
    form.querySelector('.quiz-retry').addEventListener('click',()=>{
      form.reset();form.querySelectorAll('input').forEach(input=>input.disabled=false);
      form.querySelectorAll('label').forEach(label=>label.classList.remove('is-correct','is-incorrect'));
      form.querySelector('.quiz-result').innerHTML='';form.querySelector('.quiz-submit').hidden=false;form.querySelector('.quiz-retry').hidden=true;
      form.querySelector('input').focus({preventScroll:true});
    });
  });
  refreshScore();

}
function route(){
  const id=location.hash.slice(1)||'UX-001';
  if(id==='page'){page.focus();return}
  const valid=/^M\d{2}-challenge$/.test(id)?renderChapter(id.slice(0,3)):renderLesson(id);
  if(!valid){history.replaceState(null,'','#UX-001');renderLesson('UX-001')}
  closeMobile();window.scrollTo({top:0,behavior:'instant'});page.focus({preventScroll:true});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){page.getAnimations().forEach(animation=>animation.cancel());page.animate([{opacity:0},{opacity:1}],{duration:220,easing:'ease-out'})}
}
window.addEventListener('hashchange',()=>{if(library)route()});
async function start(){const bytes=Uint8Array.from(atob(window.course204Gzip),c=>c.charCodeAt(0));library=JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text());route();import('./reading-pet.mjs?v=20261001b').then(({mountPet})=>mountPet(library,()=>currentId)).catch(error=>console.warn('Reading companion unavailable',error))}
start().catch(error=>{page.innerHTML='<h1>The lesson could not open.</h1><p>Please reload the page in a current browser.</p><button class="button" onclick="location.reload()">Try again</button>';console.error(error)});
