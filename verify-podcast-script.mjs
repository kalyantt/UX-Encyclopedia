import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const episode=JSON.parse(readFileSync(new URL('./podcast-scripts/UX-001-v1.json',import.meta.url),'utf8'));
const encoded=readFileSync(new URL('./course-204-data.js',import.meta.url),'utf8').match(/course204Gzip="([^"]+)"/)[1];
const library=JSON.parse(gunzipSync(Buffer.from(encoded,'base64')));
const lesson=library.reading[episode.lesson];
const written=[lesson.opening,...lesson.sections.map(section=>section.body)].join(' ');
const spoken=episode.turns.map(turn=>turn.text).join(' ');
const failures=[];
if(episode.turns[0]?.act!=='Before we begin')failures.push('Missing spoken introduction');
if(!episode.turns[0]?.text.toLowerCase().includes(episode.title.toLowerCase()))failures.push('Introduction does not name the lesson');
if(!/we.ll learn|you.ll learn/i.test(episode.turns[0]?.text||''))failures.push('Introduction does not preview learning');
if(!/designer/i.test(episode.characters?.alex||''))failures.push('Alex role is not documented as designer');
if(!/seeking care/i.test(episode.characters?.maya||''))failures.push('Maya role is not documented as person seeking care');
for(const name of ['Alex','Maya']){
  if(!new RegExp(`\\b${name}\\b`,'i').test(written))failures.push(`${name} absent from written lesson`);
  if(!new RegExp(`\\b${name}\\b`,'i').test(spoken))failures.push(`${name} absent from podcast`);
}
for(const [index,turn] of episode.turns.entries()){
  if(!['guide','alex'].includes(turn.speaker))failures.push(`Turn ${index+1} has unexpected speaker`);
  if(!turn.text?.trim())failures.push(`Turn ${index+1} is empty`);
}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
else console.log(`Podcast identity and opening checks passed for ${episode.lesson}: ${episode.turns.length} turns.`);
