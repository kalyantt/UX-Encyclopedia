import {existsSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {podcastVersions} from './podcast-versions.mjs';

const failures=[];
for(const [lesson,catalog] of Object.entries(podcastVersions)){
  const ids=new Set();
  const sources=new Set();
  for(const version of catalog.versions){
    if(ids.has(version.id))failures.push(`${lesson}: duplicate ${version.id}`);
    if(sources.has(version.src))failures.push(`${lesson}: ${version.id} overwrites another audio file`);
    ids.add(version.id);
    sources.add(version.src);
    for(const item of [version.src,version.transcript]){
      const path=fileURLToPath(new URL(item,import.meta.url));
      if(!existsSync(path)||statSync(path).size===0)failures.push(`${lesson}: missing or empty ${item}`);
    }
  }
  if(!ids.has(catalog.defaultVersion))failures.push(`${lesson}: default version is missing`);
}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
else console.log(`Verified ${Object.values(podcastVersions).reduce((sum,catalog)=>sum+catalog.versions.length,0)} immutable podcast versions.`);
