import {readFileSync,statSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {podcastVersions} from './podcast-versions.mjs';

const encoded=readFileSync(new URL('./course-204-data.js',import.meta.url),'utf8').match(/^window\.course204Gzip="([A-Za-z0-9+/=]+)";/)?.[1];
if(!encoded)throw new Error('Missing published course data');
const course=JSON.parse(gunzipSync(Buffer.from(encoded,'base64')));
const ids=course.index.M01.lessons.map(([id])=>id);
const base=JSON.parse(readFileSync(new URL('./podcast-scripts/UX-001-v1.json',import.meta.url),'utf8'));
const failures=[];
for(const id of ids){
  const catalog=podcastVersions[id];
  if(!catalog){failures.push(`${id}: still falls back to browser voice`);continue}
  const version=catalog.versions.find(item=>item.id===catalog.defaultVersion);
  if(!version){failures.push(`${id}: missing default recording`);continue}
  if(id==='UX-001')continue;
  const script=JSON.parse(readFileSync(new URL(`./podcast-scripts/${id}-conversation-draft.json`,import.meta.url),'utf8'));
  if(JSON.stringify(script.voices)!==JSON.stringify(base.voices))failures.push(`${id}: speaker voice IDs differ from UX-001`);
  if(!script.render_model?.includes('Chatterbox Nano')||!script.render_model?.includes('podcast-voices/guide.wav')||!script.render_model?.includes('podcast-voices/alex.wav'))failures.push(`${id}: original voice setup not documented`);
  if(script.turns[0]?.act!=='Before we begin')failures.push(`${id}: missing episode opening`);
  if(!version.note.includes('preview'))failures.push(`${id}: short recording is not identified as a preview`);
  const audio=new URL(version.src,import.meta.url);
  if(statSync(audio).size<100000)failures.push(`${id}: audio file too small`);
}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
else console.log(`Verified all ${ids.length} Chapter 1 lessons have fixed, matching-voice recordings.`);
