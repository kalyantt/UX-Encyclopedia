import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = dirname(fileURLToPath(import.meta.url));
const outputsDir = resolve(siteDir, '..');
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = [join(outputsDir, 'v1-lessons'), join(outputsDir, 'v2-lessons')]
  .flatMap(walk).filter((path) => /\/UX-\d{3}-.+\.md$/.test(path));
const lessons = files.map((path) => ({ path, text: readFileSync(path, 'utf8') }));
const failures = [];
const ids = new Map();
const paragraphOwners = new Map();
const required = [
  ['anchor', /^## Anchor case$/m],
  ['CarePath worked case', /^## .*CarePath/im],
  ['senior practice', /^## Senior lens$/m],
  ['studio exercise', /^## Studio exercise$/m],
  ['observation exercise', /^## Train Your UX Eye$/mi],
  ['references', /^## References$/m],
];

for (const lesson of lessons) {
  const heading = lesson.text.match(/^#\s+(UX-\d{3})\s+[—-]\s+(.+)$/m);
  const frontmatterId = lesson.text.match(/^id:\s*(UX-\d{3})\s*$/m)?.[1];
  const id = heading?.[1] ?? frontmatterId;
  if (!id) { failures.push(`${lesson.path}: missing lesson identity`); continue; }
  if (ids.has(id)) failures.push(`${id}: duplicate in ${lesson.path} and ${ids.get(id)}`);
  ids.set(id, lesson.path);
  for (const [label, pattern] of required) if (!pattern.test(lesson.text)) failures.push(`${id}: missing ${label}`);
  const words = lesson.text.trim().split(/\s+/).length;
  if (words < 1000) failures.push(`${id}: suspiciously narrow (${words} words)`);
  const refs = lesson.text.split(/^## References$/m)[1]?.trim();
  if (!refs || refs.length < 25) failures.push(`${id}: references are empty or decorative`);
  if (/\b(?:TODO|TBD|lorem ipsum)\b/i.test(lesson.text)) failures.push(`${id}: unresolved placeholder token`);
  if (/\?\s+(?:undo|redo|done)\b/i.test(lesson.text)) failures.push(`${id}: malformed question-mark insertion`);
  const continuity = {
    alex: /\bAlex\b/i.test(lesson.text),
    decision: /\bdecision|decide|choice|choose\b/i.test(lesson.text),
    artifact: /\bartifact|artefact|map|model|record|brief|plan|register|backlog|blueprint|prototype|matrix|repository|log|inventory|taxonomy|journey\b/i.test(lesson.text),
    uncertainty: /\buncertain|uncertainty|unknown|assumption|risk|question|next lesson|carry|carries|later lesson|UX-\d{3}\b/i.test(lesson.text),
  };
  for (const [part, passed] of Object.entries(continuity)) if (!passed) failures.push(`${id}: CarePath continuity lacks ${part}`);
  for (const paragraph of lesson.text.split(/\n\s*\n/)) {
    const normal = paragraph.replace(/^#+\s+/, '').replace(/\s+/g, ' ').trim();
    if (normal.length < 240 || normal.startsWith('|')) continue;
    const previous = paragraphOwners.get(normal);
    if (previous && previous !== id) failures.push(`${id}: long paragraph duplicates ${previous}`);
    else paragraphOwners.set(normal, id);
  }
}

for (let i = 1; i <= 204; i++) {
  const id = `UX-${String(i).padStart(3, '0')}`;
  if (!ids.has(id)) failures.push(`${id}: missing lesson`);
}

console.log(JSON.stringify({ lessons: lessons.length, uniqueIds: ids.size, failures }, null, 2));
if (failures.length) process.exitCode = 1;
