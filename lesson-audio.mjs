// A local, on-device listening mode for the published lessons. No audio or text is sent to a service.
import {podcastVersions} from './podcast-versions.mjs';
const clean=text=>text.replace(/\s+/g,' ').trim();
function chunks(text,max=210){
  const words=clean(text).split(' '),parts=[];let part='';
  for(const word of words){
    if(part&&part.length+word.length+1>max){parts.push(part);part=word}else part=part?part+' '+word:word;
  }
  if(part)parts.push(part);
  return parts;
}
export function mountAudio(library){
  const supported='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
  const synth=supported?window.speechSynthesis:null;
  let id='',sections=[],segments=[],index=0,playing=false,paused=false,token=0,rate=1,voiceURI='';
  try{rate=Number(localStorage.getItem('ux-listen-rate'))||1}catch{}
  try{voiceURI=localStorage.getItem('ux-listen-voice')||''}catch{}
  const player=()=>document.querySelector('#lesson-audio');
  const sectionFor=position=>segments[position]?.section??0;
  function status(message){const node=player()?.querySelector('.audio-status');if(node)node.textContent=message}
  function paint(){
    const root=player();if(!root?.querySelector('.audio-play'))return;
    const label=sections[sectionFor(index)]?.label||'Opening';
    root.querySelector('.audio-play').textContent=playing?(paused?'▶ Resume':'Ⅱ Pause'):'▶ Listen';
    root.querySelector('.audio-play').setAttribute('aria-label',playing?(paused?'Resume lesson audio':'Pause lesson audio'):'Play lesson audio');
    root.querySelector('.audio-location').textContent=`${label} · ${Math.min(sectionFor(index)+1,sections.length)} of ${sections.length}`;
    root.querySelector('.audio-progress').value=segments.length?Math.min(100,Math.round(index/segments.length*100)):0;
    root.querySelector('.audio-prev').disabled=!supported||index===0;
    root.querySelector('.audio-next').disabled=!supported||sectionFor(index)>=sections.length-1;
    document.querySelectorAll('.reading-section.is-speaking').forEach(node=>node.classList.remove('is-speaking'));
    if(playing){const key=sectionFor(index);if(key>0)document.querySelectorAll('.reading-section')[key-1]?.classList.add('is-speaking')}
  }
  function stop(){token++;const recording=player()?.querySelector('.audio-recording');if(recording){recording.pause();recording.currentTime=0}if(synth)synth.cancel();playing=false;paused=false;index=0;paint();status(supported?'Ready when you are.':'Listening is unavailable in this browser.')}
  function availableVoices(){return supported?synth.getVoices().filter(voice=>/^en([_-]|$)/i.test(voice.lang)).sort((a,b)=>a.name.localeCompare(b.name)):[]}
  function showVoices(){
    const select=player()?.querySelector('.audio-voice select');if(!select)return;
    const voices=availableVoices();
    select.replaceChildren(new Option('System default',''),...voices.map(voice=>new Option(`${voice.name} (${voice.lang})`,voice.voiceURI)));
    select.value=voices.some(voice=>voice.voiceURI===voiceURI)?voiceURI:'';
    select.disabled=!supported||!voices.length;
  }
  function speak(){
    if(!playing||paused||!segments[index])return;
    const current=token,utterance=new SpeechSynthesisUtterance(segments[index].text);
    utterance.rate=rate;utterance.lang=document.documentElement.lang||'en';
    const chosen=availableVoices().find(voice=>voice.voiceURI===voiceURI);if(chosen)utterance.voice=chosen;
    utterance.onend=()=>{if(current!==token)return;index++;if(index>=segments.length){playing=false;index=0;paint();status('Finished listening. Ready to replay.');return}paint();speak()};
    utterance.onerror=event=>{if(current!==token||event.error==='interrupted'||event.error==='canceled')return;playing=false;paint();status('Audio stopped. Try playing again or choose another browser voice.')};
    synth.speak(utterance);paint();
  }
  function jump(next){
    if(!supported||!segments.length)return;
    const target=sectionFor(index)+next;
    if(target<0||target>=sections.length)return;
    const start=segments.findIndex(segment=>segment.section===target);
    if(start<0)return;
    token++;synth.cancel();index=start;paused=false;
    if(playing){status('Playing…');speak()}else paint();
  }
  function sync(nextId){
    stop();id=nextId;
    const root=player(),lesson=library.reading[id];
    if(!root||!lesson)return;
    if(podcastVersions[id]){
      const catalog=podcastVersions[id];
      const initial=catalog.versions.find(version=>version.id===catalog.defaultVersion);
      root.classList.add('recorded');
      root.innerHTML=`<div class="audio-copy"><span class="audio-kicker">TWO-VOICE PODCAST</span><strong>Listen to Alex work it out</strong><span class="audio-location">Alex is the designer · Maya is the person seeking care</span></div><label class="audio-version">Choose a version <select aria-label="Podcast version">${catalog.versions.map(version=>`<option value="${version.id}">${version.label}</option>`).join('')}</select></label><audio class="audio-recording" controls preload="none" aria-label="Two-voice podcast of lesson ${id}"></audio><p class="audio-status" role="status"></p><p class="audio-alt"><a class="audio-transcript" href="${initial.transcript}">Read this version’s transcript</a><span aria-hidden="true">·</span><a href="assets/audio/UX-001.m4a">Prefer one narrator?</a></p>`;
      const selector=root.querySelector('.audio-version select');
      const recording=root.querySelector('.audio-recording');
      const transcript=root.querySelector('.audio-transcript');
      const selectVersion=version=>{
        recording.pause();
        recording.src=version.src;
        recording.setAttribute('aria-label',`${version.label} of lesson ${id}`);
        recording.load();
        transcript.href=version.transcript;
        status(`${version.note}. Recorded once; no per-play voice fee.`);
      };
      selector.value=initial.id;
      selector.onchange=()=>selectVersion(catalog.versions.find(version=>version.id===selector.value));
      selectVersion(initial);
      return;
    }
    root.classList.remove('recorded');
    sections=[{label:'Opening',text:lesson.opening},...lesson.sections.map(section=>({label:section.label,text:section.body}))];
    segments=sections.flatMap((section,sectionIndex)=>{
      const plain=section.text.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[#*_`>|]/g,' ').replace(/\s+/g,' ');
      return chunks(`${section.label}. ${plain}`).map(text=>({section:sectionIndex,text}));
    });
    const minutes=Math.max(1,Math.round(segments.reduce((sum,segment)=>sum+segment.text.split(' ').length,0)/160));
    root.innerHTML=`<div class="audio-copy"><span class="audio-kicker">LISTENING MODE</span><strong>Hear the story</strong><span class="audio-location"></span></div><div class="audio-controls"><button class="audio-prev" type="button" aria-label="Previous section">⏮</button><button class="audio-play" type="button"></button><button class="audio-next" type="button" aria-label="Next section">⏭</button><label class="audio-speed">Speed <select aria-label="Playback speed"><option value="0.85">0.85×</option><option value="1">1×</option><option value="1.2">1.2×</option><option value="1.4">1.4×</option></select></label></div><label class="audio-voice">Voice <select aria-label="Reading voice"></select></label><progress class="audio-progress" max="100" value="0" aria-label="Audio progress"></progress><p class="audio-status" role="status">${supported?`About ${minutes} min · Device voices vary · No recording or upload`:'Listening is unavailable in this browser.'}</p>`;
    root.querySelector('.audio-speed select').value=String(rate);
    showVoices();
    root.querySelector('.audio-play').disabled=!supported;
    root.querySelector('.audio-prev').onclick=()=>jump(-1);
    root.querySelector('.audio-next').onclick=()=>jump(1);
    root.querySelector('.audio-speed select').onchange=event=>{
      rate=Number(event.target.value);
      try{localStorage.setItem('ux-listen-rate',String(rate))}catch{}
      if(playing){token++;synth.cancel();paused=false;speak()}
    };
    root.querySelector('.audio-voice select').onchange=event=>{
      voiceURI=event.target.value;
      try{localStorage.setItem('ux-listen-voice',voiceURI)}catch{}
      if(playing){token++;synth.cancel();paused=false;status('Playing with the selected voice…');speak()}
      else status('Voice selected. Press Listen to hear it.');
    };
    root.querySelector('.audio-play').onclick=()=>{
      if(!supported)return;
      if(!playing){playing=true;paused=false;status('Playing…');speak()}
      else if(paused){paused=false;synth.resume();status('Playing…');paint()}
      else{paused=true;synth.pause();status('Paused.');paint()}
    };
    paint();
  }
  window.addEventListener('beforeunload',stop);
  if(supported)synth.addEventListener('voiceschanged',showVoices);
  return {sync,stop};
}
