import {createIndex,findPassages} from './pet-search.mjs?v=20261001b';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const face=`<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse class="pip-shadow" cx="50" cy="89" rx="29" ry="5" fill="#203b3020"/><g class="pip-character"><path class="pip-body" d="M22 52C18 35 23 23 31 28L39 33Q51 28 62 33L72 26Q85 23 79 51Q90 78 70 86Q50 92 30 85Q13 79 22 52" fill="#edd5a5" stroke="#355044" stroke-width="2.3"/><path class="pip-sprout" d="M46 31Q39 13 50 12Q58 14 51 31M51 25Q58 13 66 19Q69 26 51 30" fill="#83a979" stroke="#355044" stroke-width="2"/><ellipse cx="31" cy="66" rx="7" ry="4" fill="#d68f8177"/><ellipse cx="70" cy="66" rx="7" ry="4" fill="#d68f8177"/><g class="pip-eyes" fill="#203b30"><ellipse cx="36" cy="55" rx="3" ry="4"/><ellipse cx="64" cy="55" rx="3" ry="4"/></g><path class="pip-brows" d="M31 46l9 3m29-3l-9 3" fill="none" stroke="#203b30" stroke-width="2.5" stroke-linecap="round"/><path class="pip-mouth" d="M44 65Q50 72 56 65" fill="none" stroke="#203b30" stroke-width="2.5" stroke-linecap="round"/><path d="M31 81L29 86M69 81L71 86" stroke="#355044" stroke-width="2" stroke-linecap="round"/></g></svg>`;
export function mountPet(library,getCurrentId){
  let index=null,moodTimer,playing=false,gameRunning=false,gameOver=false,gameFrame=0,gameLast=0,gameScore=0,gameSpeed=175,gameSpawn=0,jumpHeight=0,jumpVelocity=0,stones=[];
  const root=document.createElement('aside');root.id='reading-pet';root.setAttribute('aria-label','Pip reading companion');
  root.innerHTML=`<button class="pip-launch" aria-expanded="false" aria-controls="pip-panel" aria-label="Open Pip, your reading companion">${face}<span>Pip</span></button><section id="pip-panel" class="pip-panel" role="dialog" aria-labelledby="pip-title" hidden><header class="pip-header"><div><h2 id="pip-title">A little company. <em>A little clarity.</em></h2><p>Pip · your course companion</p></div><button class="pip-close" aria-label="Close Pip">×</button></header><div class="pip-intro"><button class="pip-pat" aria-label="Give Pip a gentle pat">${face}</button><p class="pip-mood" role="status">Hi, I’m Pip. Read with me, or take a little break.</p></div><div class="pip-tabs"><button data-view="ask" aria-pressed="true">Ask Pip</button><button data-view="play" aria-pressed="false">Play a little</button></div><div class="pip-ask"><p class="pip-boundary">I find passages in the published course, not the full books or the web. Matches are reading suggestions, not AI-generated answers.</p><form class="pip-form"><label for="pip-question">What are you wondering about?</label><input id="pip-question" maxlength="400" autocomplete="off" placeholder="What is a mental model?" required><button class="button" type="submit">Find it in the course</button></form><div class="pip-answer" role="region" aria-label="Pip’s reading suggestions"><p>Every suggestion includes a passage and a link back to its lesson.</p></div><p class="pip-search-status" role="status"></p></div><div class="pip-play" hidden><p class="pip-game-intro">Pip’s little trail. Hop over the stones. Tap, click, or press Space to jump.</p><div class="pip-runner" tabindex="0" role="button" aria-label="Pip runner game; press Space to jump"><div class="pip-runner-cloud">✦</div><div class="pip-runner-ground"></div><div class="pip-runner-avatar">${face}</div><div class="pip-runner-obstacles"></div></div><p class="pip-game-score" role="status">Score 0 · Best 0</p><p class="pip-game-note" aria-live="polite">Ready for a little run?</p><div class="pip-game-actions"><button class="button pip-start" type="button">Start running</button><button class="button secondary pip-jump" type="button">Jump</button></div></div><footer class="pip-footer">Private by default. Questions stay in this page and aren’t sent to a server.</footer></section>`;
  document.body.append(root);
  const panel=root.querySelector('#pip-panel'),launcher=root.querySelector('.pip-launch'),mood=root.querySelector('.pip-mood'),answer=root.querySelector('.pip-answer'),status=root.querySelector('.pip-search-status');
  function express(state,text){clearTimeout(moodTimer);root.dataset.mood=state;mood.textContent=text;if(['happy','laugh','angry'].includes(state))moodTimer=setTimeout(()=>{root.dataset.mood='calm'},state==='laugh'?2400:state==='angry'?2200:1400)}
  function open(value){panel.hidden=!value;launcher.setAttribute('aria-expanded',String(value));if(!value)pauseGame();if(value)root.querySelector('.pip-close').focus({preventScroll:true});else launcher.focus({preventScroll:true})}
  launcher.onclick=()=>open(panel.hidden);root.querySelector('.pip-close').onclick=()=>open(false);
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.stopPropagation();open(false)}});
  root.querySelector('.pip-pat').onclick=()=>express('laugh','That tickles! I like reading with you.');
  root.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{
    playing=button.dataset.view==='play';root.querySelector('.pip-ask').hidden=playing;root.querySelector('.pip-play').hidden=!playing;
    root.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    if(!playing)pauseGame();
    express('calm',playing?'Let’s see what you remember.':'Let’s find a passage together.');
  });
  function show(entries){
    answer.innerHTML=entries.map(entry=>`<article class="pip-source"><p class="pip-source-label">Course passage · ${escape(entry.id)}</p><blockquote>${escape(entry.text.length>950?entry.text.slice(0,950)+'…':entry.text)}</blockquote><a href="#${escape(entry.id)}">Read: ${escape(entry.title)} →</a><p class="pip-section-name">${escape(entry.section)}</p></article>`).join('');
    answer.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>open(false)));
    status.textContent=`Found ${entries.length} relevant course passage${entries.length===1?'':'s'}.`;
    express('happy','I found something to read together. Check whether it answers your question.');
  }
  root.querySelector('.pip-form').onsubmit=event=>{
    event.preventDefault();const question=root.querySelector('#pip-question').value.trim();if(!question)return;
    if(!index)index=createIndex(library);
    const results=findPassages(index,question,getCurrentId());
    if(results.length){show(results);return}
    answer.innerHTML='<p>I couldn’t find a strong supporting passage in this course. Try a specific UX term or product problem.</p><p>I can’t tell whether the original books cover it, and I won’t invent an answer.</p>';
    status.textContent='No supporting course passage found.';express('sad','Sorry, this one is beyond what I can find in the course.');
  };
  const board=root.querySelector('.pip-runner'),avatar=root.querySelector('.pip-runner-avatar'),obstacleLayer=root.querySelector('.pip-runner-obstacles'),score=root.querySelector('.pip-game-score'),gameNote=root.querySelector('.pip-game-note'),startButton=root.querySelector('.pip-start');
  let best=0;try{best=Number(localStorage.getItem('pip-runner-best'))||0}catch{}
  function updateScore(){score.textContent=`Score ${Math.floor(gameScore)} · Best ${best}`}
  function pauseGame(){gameRunning=false;cancelAnimationFrame(gameFrame);gameLast=0;if(!gameOver&&gameScore>0){startButton.textContent='Continue running';gameNote.textContent='Paused. Your trail is here when you return.'}}
  function finishGame(){
    pauseGame();gameOver=true;board.classList.add('is-over');startButton.textContent='Try again';
    best=Math.max(best,Math.floor(gameScore));try{localStorage.setItem('pip-runner-best',String(best))}catch{}
    updateScore();gameNote.textContent=`Pip reached ${Math.floor(gameScore)} steps. Try another run!`;
    express('angry','Oof! That stone surprised me. One more try?');
  }
  function jump(){
    if(!gameRunning){startGame();return}
    if(jumpHeight<2){jumpVelocity=410;express('happy','Boing! Nice jump.');}
  }
  function tick(now){
    if(!gameRunning)return;
    const delta=Math.min(.04,(now-(gameLast||now))/1000);gameLast=now;
    jumpHeight=Math.max(0,jumpHeight+jumpVelocity*delta);jumpVelocity-=1120*delta;
    if(jumpHeight===0)jumpVelocity=0;
    avatar.style.transform=`translateY(${-jumpHeight}px)`;
    gameScore+=delta*10;gameSpeed=Math.min(330,175+gameScore*.8);gameSpawn-=delta;
    const width=board.clientWidth;
    if(gameSpawn<=0){const element=document.createElement('span');element.className='pip-stone';element.setAttribute('aria-hidden','true');obstacleLayer.append(element);stones.push({x:width+20,element,passed:false});gameSpawn=1.1+Math.random()*.8}
    stones=stones.filter(stone=>{
      stone.x-=gameSpeed*delta;stone.element.style.transform=`translateX(${stone.x}px)`;
      if(stone.x<62&&stone.x>26&&jumpHeight<27){finishGame();return true}
      if(!stone.passed&&stone.x<28){stone.passed=true;express('laugh','You made it! Keep going.');}
      if(stone.x< -35){stone.element.remove();return false}return true;
    });
    updateScore();if(gameRunning)gameFrame=requestAnimationFrame(tick);
  }
  function startGame(){
    if(gameOver){gameOver=false;board.classList.remove('is-over');gameScore=0;gameSpeed=175;jumpHeight=0;jumpVelocity=0;stones=[];obstacleLayer.replaceChildren();avatar.style.transform='translateY(0)';updateScore()}
    if(gameRunning)return;
    gameRunning=true;gameLast=0;gameSpawn=.8;startButton.textContent='Pause';gameNote.textContent='Jump over the stones!';board.focus({preventScroll:true});gameFrame=requestAnimationFrame(tick);
  }
  startButton.onclick=()=>gameRunning?pauseGame():startGame();
  root.querySelector('.pip-jump').onclick=jump;
  board.onclick=jump;
  board.onkeydown=event=>{if(event.key===' '||event.key==='ArrowUp'){event.preventDefault();jump()}};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame()});
  updateScore();
}
