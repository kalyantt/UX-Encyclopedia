// A local, on-device listening mode for the published lessons. No audio or text is sent to a service.
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
  let id='',sections=[],segments=[],index=0,playing=false,paused=false,token=0,rate=1;
  try{rate=Number(localStorage.getItem('ux-listen-rate'))||1}catch{}
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
  function stop(){token++;if(synth)synth.cancel();playing=false;paused=false;index=0;paint();status(supported?'Ready when you are.':'Listening is unavailable in this browser.')}
  function speak(){
    if(!playing||paused||!segments[index])return;
    const current=token,utterance=new SpeechSynthesisUtterance(segments[index].text);
    utterance.rate=rate;utterance.lang=document.documentElement.lang||'en';
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
    sections=[{label:'Opening',text:lesson.opening},...lesson.sections.map(section=>({label:section.label,text:section.body}))];
    segments=sections.flatMap((section,sectionIndex)=>{
      const plain=section.text.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[#*_`>|]/g,' ').replace(/\s+/g,' ');
      return chunks(`${section.label}. ${plain}`).map(text=>({section:sectionIndex,text}));
    });
    const minutes=Math.max(1,Math.round(segments.reduce((sum,segment)=>sum+segment.text.split(' ').length,0)/160));
    root.innerHTML=`<div class="audio-copy"><span class="audio-kicker">LISTENING MODE</span><strong>Hear the story</strong><span class="audio-location"></span></div><div class="audio-controls"><button class="audio-prev" type="button" aria-label="Previous section">⏮</button><button class="audio-play" type="button"></button><button class="audio-next" type="button" aria-label="Next section">⏭</button><label class="audio-speed">Speed <select aria-label="Playback speed"><option value="0.85">0.85×</option><option value="1">1×</option><option value="1.2">1.2×</option><option value="1.4">1.4×</option></select></label></div><progress class="audio-progress" max="100" value="0" aria-label="Audio progress"></progress><p class="audio-status" role="status">${supported?`About ${minutes} min · Uses your browser’s voice · No recording or upload`:'Listening is unavailable in this browser.'}</p>`;
    root.querySelector('.audio-speed select').value=String(rate);
    root.querySelector('.audio-play').disabled=!supported;
    root.querySelector('.audio-prev').onclick=()=>jump(-1);
    root.querySelector('.audio-next').onclick=()=>jump(1);
    root.querySelector('.audio-speed select').onchange=event=>{
      rate=Number(event.target.value);
      try{localStorage.setItem('ux-listen-rate',String(rate))}catch{}
      if(playing){token++;synth.cancel();paused=false;speak()}
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
  return {sync,stop};
}
