import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';

const root=new URL('./',import.meta.url);
const source=new URL('./podcast-scripts/editorial-drafts/',root);
const destination=new URL('./podcast-scripts/opening-v2/',root);
mkdirSync(destination,{recursive:true});

function spokenTitle(script){
  if(script.lesson==='UX-001')return 'What is UX?';
  const title=script.title.replace(/[.!?]+$/,'');
  return /[!?]$/.test(script.title)?`${title}?`:`${title}.`;
}

let count=0;
for(const name of readdirSync(source).filter(name=>/^UX-\d{3}-editorial-draft\.json$/.test(name)).sort()){
  const script=JSON.parse(readFileSync(new URL(name,source),'utf8'));
  if(script.lesson==='UX-007')continue; // This lesson already has a bespoke published recording.
  // The old first two turns repeat a stock introduction and question. Keep
  // the lesson-specific opening that follows, so it plays only once.
  script.turns=[
    {speaker:'host',act:'Before we begin',mood:'curious',text:spokenTitle(script)},
    ...script.turns.slice(2),
  ];
  script.editorial_note='Opening revised to lead with the lesson itself. Remaining dialogue is an automated editorial draft; review spoken wording and meaning before final publication.';
  writeFileSync(new URL(name.replace('-editorial-draft','-opening-v2'),destination),JSON.stringify(script,null,2)+'\n');
  count++;
}
console.log(`Prepared ${count} revised openings; UX-007 keeps its bespoke recording.`);
