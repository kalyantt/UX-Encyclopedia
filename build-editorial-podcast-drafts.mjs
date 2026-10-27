import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const encoded=readFileSync(new URL('./course-204-data-editorial-preview.js',import.meta.url),'utf8').match(/^window\.course204Gzip="([A-Za-z0-9+/=]+)";/)?.[1];
if(!encoded)throw new Error('Build the editorial lesson preview first');
const course=JSON.parse(gunzipSync(Buffer.from(encoded,'base64')));
const destination=new URL('./podcast-scripts/editorial-drafts/',import.meta.url);
mkdirSync(destination,{recursive:true});
const spoken=value=>String(value||'')
  .replace(/\[([^\]]+)\]\([^)]*\)/g,'$1')
  .replace(/\*\*|__|[*_`#>]/g,'')
  .replace(/^\s*[-•]\s+/gm,'')
  .replace(/\bUX-(\d{3})\b/g,(_,number)=>`lesson ${Number(number)}`)
  .replace(/\s+/g,' ').trim();
const sentences=value=>spoken(value).match(/[^.!?]+[.!?]+(?:[”’])?|[^.!?]+$/g)?.map(part=>part.trim()).filter(Boolean)||[];
const groups=(value,max=380)=>{
  const result=[];let buffer='';
  for(const sentence of sentences(value)){
    if(buffer&&buffer.length+sentence.length+1>max){result.push(buffer);buffer=''}
    buffer=buffer?`${buffer} ${sentence}`:sentence;
  }
  if(buffer)result.push(buffer);
  return result;
};
const question=label=>({
  'Why it happens':'Why does that happen?',
  'Put it to work':'What would you do with that in a real product?',
  'The harder decision':'Where does the harder design decision appear?',
  'Senior lens':'What would a senior designer challenge here?',
  'Failure modes':'Where does this approach tend to fail?',
  'Look more closely':'What should we look at more closely?',
  'Course thread':'How does this connect to the previous lesson?',
  'Going deeper':"There is more to this than the first explanation, isn't there?",
  'Build an evidence case':'What evidence would make that decision defensible?',
  'Design safeguards as a system':'What safeguards does the whole system need?',
}[label]||(/^Mechanism:\s*/.test(label)?`How does ${spoken(label.replace(/^Mechanism:\s*/, '')).toLowerCase()} actually work?`:
  /^Worked example:\s*/.test(label)?`Can you walk me through ${spoken(label.replace(/^Worked example:\s*/, '')).toLowerCase()}?`:
  /^Follow\s/.test(label)?`Can we follow ${spoken(label.replace(/^Follow\s*/, '')).toLowerCase()} step by step?`:
  /\?$/.test(label)?spoken(label):`What changes when we look at ${spoken(label).toLowerCase()}?`));
let written=0;
let preserved=0;
const force=process.argv.includes('--force');
const start=process.argv.find(arg=>arg.startsWith('--start='))?.split('=')[1]||'UX-001';
const end=process.argv.find(arg=>arg.startsWith('--end='))?.split('=')[1]||'UX-204';
for(const [id,lesson] of Object.entries(course.reading)){
  if(id<start||id>end)continue;
  const file=new URL(`${id}-editorial-draft.json`,destination);
  if(existsSync(file)&&!force){preserved++;continue}
  const title=course.chapters[id].match(/^#\s+UX-\d{3}\s+[—–-]\s+(.+)$/m)?.[1]
    ||course.chapters[id].match(/^title:\s*(.+)$/m)?.[1]
    ||id;
  const spokenTitle=id==='UX-001'?'What is UX?':/[!?]$/.test(title)?title:`${title}.`;
  const turns=[
    {speaker:'host',act:'Before we begin',mood:'curious',text:spokenTitle},
    ...groups(lesson.opening).map(text=>({speaker:'guide',mood:'clear',text})),
  ];
  for(const [sectionIndex,section] of lesson.sections.entries()){
    turns.push({speaker:'host',act:section.label,mood:sectionIndex%2?'thinking':'curious',text:question(section.label)});
    const paragraphs=section.body.split(/\n\s*\n/).map(spoken).filter(Boolean);
    for(const paragraph of paragraphs){
      for(const text of groups(paragraph))turns.push({speaker:'guide',mood:sectionIndex%3===2?'thinking':'clear',text});
    }
  }
  if(lesson.example){
    turns.push({speaker:'host',act:'Product example',mood:'curious',text:'Can we see that in a concrete product situation?'});
    for(const text of groups(lesson.example))turns.push({speaker:'guide',mood:'warm',text});
  }
  if(lesson.thread){
    turns.push({speaker:'host',act:'Connect the lessons',mood:'thinking',text:'How does this connect to what we have already learned?'});
    for(const text of groups(lesson.thread))turns.push({speaker:'guide',mood:'clear',text});
  }
  if(lesson.observe){
    turns.push({speaker:'host',act:'Try it yourself',mood:'warm',text:'What should I notice the next time I use a product?'});
    for(const text of groups(lesson.observe))turns.push({speaker:'guide',mood:'warm',text});
  }
  const script={lesson:id,title,voices:{guide:'af_heart',host:'am_michael'},editorial_note:'Automated dialogue draft from the revised lesson. Review spoken wording and meaning before publishing.',turns};
  writeFileSync(file,JSON.stringify(script,null,2)+'\n');written++;
}
console.log(`Built ${written} two-voice script drafts; preserved ${preserved} existing scripts.`);
