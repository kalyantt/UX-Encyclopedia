import {createIndex,findPassages,plain} from './pet-search.mjs?v=20261001b';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const face=`<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="89" rx="29" ry="5" fill="#203b3020"/><path class="pip-body" d="M22 52C18 35 23 23 31 28L39 33Q51 28 62 33L72 26Q85 23 79 51Q90 78 70 86Q50 92 30 85Q13 79 22 52" fill="#edd5a5" stroke="#355044" stroke-width="2.3"/><path d="M46 31Q39 13 50 12Q58 14 51 31M51 25Q58 13 66 19Q69 26 51 30" fill="#83a979" stroke="#355044" stroke-width="2"/><ellipse cx="31" cy="66" rx="7" ry="4" fill="#d68f8177"/><ellipse cx="70" cy="66" rx="7" ry="4" fill="#d68f8177"/><g class="pip-eyes" fill="#203b30"><ellipse cx="36" cy="55" rx="3" ry="4"/><ellipse cx="64" cy="55" rx="3" ry="4"/></g><path class="pip-mouth" d="M44 65Q50 72 56 65" fill="none" stroke="#203b30" stroke-width="2.5" stroke-linecap="round"/><path d="M31 81L29 86M69 81L71 86" stroke="#355044" stroke-width="2" stroke-linecap="round"/></svg>`;
export function mountPet(library,getCurrentId){
  let index=null,moodTimer,playing=false,caught=0;
  const root=document.createElement('aside');root.id='reading-pet';root.setAttribute('aria-label','Pip reading companion');
  root.innerHTML=`<button class="pip-launch" aria-expanded="false" aria-controls="pip-panel" aria-label="Open Pip, your reading companion">${face}<span>Pip</span></button><section id="pip-panel" class="pip-panel" role="dialog" aria-labelledby="pip-title" hidden><header class="pip-header"><div><h2 id="pip-title">A little company. <em>A little clarity.</em></h2><p>Pip · your course companion</p></div><button class="pip-close" aria-label="Close Pip">×</button></header><div class="pip-intro"><button class="pip-pat" aria-label="Give Pip a gentle pat">${face}</button><p class="pip-mood" role="status">Hi, I’m Pip. Read with me, or take a little break.</p></div><div class="pip-tabs"><button data-view="ask" aria-pressed="true">Ask Pip</button><button data-view="play" aria-pressed="false">Play a little</button></div><div class="pip-ask"><p class="pip-boundary">I find passages in the published course, not the full books or the web. Matches are reading suggestions, not AI-generated answers.</p><form class="pip-form"><label for="pip-question">What are you wondering about?</label><input id="pip-question" maxlength="400" autocomplete="off" placeholder="What is a mental model?" required><button class="button" type="submit">Find it in the course</button></form><button class="pip-context" type="button">Help with the section I’m reading</button><div class="pip-answer" role="region" aria-label="Pip’s reading suggestions"><p>Every suggestion includes a passage and a link back to its lesson.</p></div><p class="pip-search-status" role="status"></p></div><div class="pip-play" hidden><p>Catch five leaves for Pip. No timer, no pressure.</p><div class="pip-garden"><button class="pip-leaf" aria-label="Catch the leaf">❧</button></div><p class="pip-game-score" role="status">0 of 5 leaves collected.</p><button class="button secondary pip-reset" type="button">Start again</button></div><footer class="pip-footer">Private by default. Questions stay in this page and aren’t sent to a server.</footer></section>`;
  document.body.append(root);
  const panel=root.querySelector('#pip-panel'),launcher=root.querySelector('.pip-launch'),mood=root.querySelector('.pip-mood'),answer=root.querySelector('.pip-answer'),status=root.querySelector('.pip-search-status');
  function express(state,text){clearTimeout(moodTimer);root.dataset.mood=state;mood.textContent=text;if(state==='happy')moodTimer=setTimeout(()=>{root.dataset.mood='calm'},1400)}
  function open(value){panel.hidden=!value;launcher.setAttribute('aria-expanded',String(value));if(value)root.querySelector('.pip-close').focus({preventScroll:true});else launcher.focus({preventScroll:true})}
  launcher.onclick=()=>open(panel.hidden);root.querySelector('.pip-close').onclick=()=>open(false);
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.stopPropagation();open(false)}});
  root.querySelector('.pip-pat').onclick=()=>express('happy','A little pat! Thank you. Ready when you are.');
  root.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{
    playing=button.dataset.view==='play';root.querySelector('.pip-ask').hidden=playing;root.querySelector('.pip-play').hidden=!playing;
    root.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    express('calm',playing?'Let’s collect a few leaves.':'Let’s find a passage together.');
  });
  function show(entries){
    answer.innerHTML=entries.map(entry=>`<article class="pip-source"><p class="pip-source-label">Course passage · ${escape(entry.id)}</p><blockquote>${escape(entry.text.length>950?entry.text.slice(0,950)+'…':entry.text)}</blockquote><a href="#${escape(entry.id)}">Read: ${escape(entry.title)} →</a><p class="pip-section-name">${escape(entry.section)}</p><details><summary>Lesson references</summary><p>${escape(entry.refs)}</p><p>These are the lesson’s references, not a verified page-level citation for this excerpt.</p></details></article>`).join('');
    answer.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>open(false)));
    status.textContent=`Found ${entries.length} relevant course passage${entries.length===1?'':'s'}.`;
    express('happy','I found something to read together. Check whether it answers your question.');
  }
  root.querySelector('.pip-form').onsubmit=event=>{
    event.preventDefault();const question=root.querySelector('#pip-question').value.trim();if(!question)return;
    if(!index)index=createIndex(library);
    const results=findPassages(index,question,getCurrentId());
    if(results.length){show(results);return}
    answer.innerHTML='<p>I couldn’t find a strong supporting passage in this course. Try the key concept, or use “Help with the section I’m reading”.</p><p>I can’t tell whether the original books cover it, and I won’t invent an answer.</p>';
    status.textContent='No supporting course passage found.';express('sad','Sorry, this one is beyond what I can find in the course.');
  };
  root.querySelector('.pip-context').onclick=()=>{
    const id=getCurrentId(),lesson=library.reading[id];
    if(!lesson){answer.textContent='Open a lesson first, then ask me about its section.';express('sad','I need a lesson to read with you.');return}
    const title=Object.values(library.index).flatMap(m=>m.lessons).find(([lid])=>lid===id)?.[1]||id;
    const heading=document.querySelector('.reading-section[open] .section-title')?.textContent;
    const section=lesson.sections.find(s=>s.label===heading);
    show([{id,title,section:section?.label||'Lesson opening',text:plain(section?.body||lesson.opening),refs:plain(lesson.refs)}]);
  };
  const leaf=root.querySelector('.pip-leaf'),score=root.querySelector('.pip-game-score');
  leaf.onclick=()=>{
    caught++;score.textContent=`${caught} of 5 leaves collected.`;
    express('happy',caught===5?'Five leaves! A lovely little break. Back to reading?':'Got it! One more leaf for the garden.');
    if(caught===5){leaf.hidden=true;return}
    leaf.style.left=(10+Math.random()*65)+'%';leaf.style.top=(8+Math.random()*55)+'%';
  };
  root.querySelector('.pip-reset').onclick=()=>{caught=0;leaf.hidden=false;leaf.style.left='40%';leaf.style.top='30%';score.textContent='0 of 5 leaves collected.';express('calm','A fresh patch of leaves.');leaf.focus({preventScroll:true})};
}
