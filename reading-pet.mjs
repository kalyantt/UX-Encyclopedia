import {createIndex,findPassages,plain} from './pet-search.mjs?v=20261001b';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const face=`<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse class="pip-shadow" cx="50" cy="89" rx="29" ry="5" fill="#203b3020"/><g class="pip-character"><path class="pip-body" d="M22 52C18 35 23 23 31 28L39 33Q51 28 62 33L72 26Q85 23 79 51Q90 78 70 86Q50 92 30 85Q13 79 22 52" fill="#edd5a5" stroke="#355044" stroke-width="2.3"/><path class="pip-sprout" d="M46 31Q39 13 50 12Q58 14 51 31M51 25Q58 13 66 19Q69 26 51 30" fill="#83a979" stroke="#355044" stroke-width="2"/><ellipse cx="31" cy="66" rx="7" ry="4" fill="#d68f8177"/><ellipse cx="70" cy="66" rx="7" ry="4" fill="#d68f8177"/><g class="pip-eyes" fill="#203b30"><ellipse cx="36" cy="55" rx="3" ry="4"/><ellipse cx="64" cy="55" rx="3" ry="4"/></g><path class="pip-brows" d="M31 46l9 3m29-3l-9 3" fill="none" stroke="#203b30" stroke-width="2.5" stroke-linecap="round"/><path class="pip-mouth" d="M44 65Q50 72 56 65" fill="none" stroke="#203b30" stroke-width="2.5" stroke-linecap="round"/><path d="M31 81L29 86M69 81L71 86" stroke="#355044" stroke-width="2" stroke-linecap="round"/></g></svg>`;
export function mountPet(library,getCurrentId){
  let index=null,moodTimer,playing=false,gameLocked=false,gameTurns=0,gamePairs=0,firstCard=null,flipTimer;
  const root=document.createElement('aside');root.id='reading-pet';root.setAttribute('aria-label','Pip reading companion');
  root.innerHTML=`<button class="pip-launch" aria-expanded="false" aria-controls="pip-panel" aria-label="Open Pip, your reading companion">${face}<span>Pip</span></button><section id="pip-panel" class="pip-panel" role="dialog" aria-labelledby="pip-title" hidden><header class="pip-header"><div><h2 id="pip-title">A little company. <em>A little clarity.</em></h2><p>Pip · your course companion</p></div><button class="pip-close" aria-label="Close Pip">×</button></header><div class="pip-intro"><button class="pip-pat" aria-label="Give Pip a gentle pat">${face}</button><p class="pip-mood" role="status">Hi, I’m Pip. Read with me, or take a little break.</p></div><div class="pip-tabs"><button data-view="ask" aria-pressed="true">Ask Pip</button><button data-view="play" aria-pressed="false">Play a little</button></div><div class="pip-ask"><p class="pip-boundary">I find passages in the published course, not the full books or the web. Matches are reading suggestions, not AI-generated answers.</p><form class="pip-form"><label for="pip-question">What are you wondering about?</label><input id="pip-question" maxlength="400" autocomplete="off" placeholder="What is a mental model?" required><button class="button" type="submit">Find it in the course</button></form><button class="pip-context" type="button">Help with the section I’m reading</button><div class="pip-answer" role="region" aria-label="Pip’s reading suggestions"><p>Every suggestion includes a passage and a link back to its lesson.</p></div><p class="pip-search-status" role="status"></p></div><div class="pip-play" hidden><p class="pip-game-intro">Pip’s memory garden: pair each UX idea with the product moment that shows it. No timer.</p><div class="pip-memory" role="group" aria-label="Memory matching cards"></div><p class="pip-game-score" role="status">Find the four pairs.</p><p class="pip-game-note" aria-live="polite">Turn over any two cards to begin.</p><button class="button secondary pip-reset" type="button">Shuffle and play again</button></div><footer class="pip-footer">Private by default. Questions stay in this page and aren’t sent to a server.</footer></section>`;
  document.body.append(root);
  const panel=root.querySelector('#pip-panel'),launcher=root.querySelector('.pip-launch'),mood=root.querySelector('.pip-mood'),answer=root.querySelector('.pip-answer'),status=root.querySelector('.pip-search-status');
  function express(state,text){clearTimeout(moodTimer);root.dataset.mood=state;mood.textContent=text;if(['happy','laugh','angry'].includes(state))moodTimer=setTimeout(()=>{root.dataset.mood='calm'},state==='laugh'?2400:state==='angry'?2200:1400)}
  function open(value){panel.hidden=!value;launcher.setAttribute('aria-expanded',String(value));if(value)root.querySelector('.pip-close').focus({preventScroll:true});else launcher.focus({preventScroll:true})}
  launcher.onclick=()=>open(panel.hidden);root.querySelector('.pip-close').onclick=()=>open(false);
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.stopPropagation();open(false)}});
  root.querySelector('.pip-pat').onclick=()=>express('laugh','That tickles! I like reading with you.');
  root.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{
    playing=button.dataset.view==='play';root.querySelector('.pip-ask').hidden=playing;root.querySelector('.pip-play').hidden=!playing;
    root.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    if(playing&&!root.querySelector('.pip-memory').children.length)startGame();
    express('calm',playing?'Let’s see what you remember.':'Let’s find a passage together.');
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
    const sections=[...document.querySelectorAll('.reading-section')];
    const current=sections.filter(node=>node.getBoundingClientRect().top<innerHeight*.45).at(-1);
    const heading=current?.querySelector('.section-title')?.textContent;
    const section=lesson.sections.find(s=>s.label===heading);
    show([{id,title,section:section?.label||'Lesson opening',text:plain(section?.body||lesson.opening),refs:plain(lesson.refs)}]);
  };
  const pairs=[
    {id:'feedback',idea:'Feedback',moment:'“Saved” appears after the action',note:'Feedback lets someone know what the system did.'},
    {id:'recognition',idea:'Recognition',moment:'Choices stay visible on screen',note:'Visible choices reduce the need to remember.'},
    {id:'recovery',idea:'Recovery',moment:'Undo a mistaken action',note:'Recovery makes mistakes less costly.'},
    {id:'disclosure',idea:'Progressive disclosure',moment:'Details appear when needed',note:'Good timing makes complexity easier to handle.'},
  ];
  const board=root.querySelector('.pip-memory'),score=root.querySelector('.pip-game-score'),gameNote=root.querySelector('.pip-game-note');
  function startGame(){
    clearTimeout(flipTimer);gameLocked=false;gameTurns=0;gamePairs=0;firstCard=null;
    const cards=pairs.flatMap(pair=>[{id:pair.id,kind:'idea',text:pair.idea},{id:pair.id,kind:'moment',text:pair.moment}]);
    for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]]}
    board.replaceChildren(...cards.map((card,index)=>{
      const button=document.createElement('button');button.type='button';button.className='pip-card';button.dataset.pair=card.id;button.dataset.kind=card.kind;button.dataset.face=card.text;button.textContent='?';button.setAttribute('aria-label',`Card ${index+1}, face down`);return button;
    }));
    score.textContent='0 of 4 pairs · 0 turns';gameNote.textContent='Turn over any two cards to begin.';
  }
  board.onclick=event=>{
    const card=event.target.closest('.pip-card');
    if(!card||!board.contains(card)||gameLocked||card.classList.contains('is-flipped')||card.classList.contains('is-matched'))return;
    card.classList.add('is-flipped');card.textContent=card.dataset.face;card.setAttribute('aria-label',card.dataset.face);
    if(!firstCard){firstCard=card;return}
    const first=firstCard;firstCard=null;gameTurns++;
    if(first.dataset.pair===card.dataset.pair&&first.dataset.kind!==card.dataset.kind){
      first.classList.add('is-matched');card.classList.add('is-matched');first.disabled=true;card.disabled=true;gamePairs++;
      const pair=pairs.find(item=>item.id===card.dataset.pair);
      gameNote.textContent=pair.note;
      express(gamePairs===pairs.length?'laugh':'happy',gamePairs===pairs.length?'All four pairs! You made my garden bloom.':'That pair belongs together!');
      if(gamePairs===pairs.length){board.classList.add('is-complete');gameNote.textContent='You found all four connections. '+pair.note}
    }else{
      gameLocked=true;express('angry','Oh, not that pair. Let’s look again.');gameNote.textContent='Not a match. Remember where those cards are.';
      flipTimer=setTimeout(()=>{for(const item of [first,card]){item.classList.remove('is-flipped');item.textContent='?';item.setAttribute('aria-label','Face-down memory card')}gameLocked=false},1050);
    }
    score.textContent=`${gamePairs} of 4 pairs · ${gameTurns} turn${gameTurns===1?'':'s'}`;
  };
  root.querySelector('.pip-reset').onclick=()=>{board.classList.remove('is-complete');startGame();express('happy','Fresh cards! Let’s try a new path.');board.querySelector('.pip-card')?.focus({preventScroll:true})};
}
