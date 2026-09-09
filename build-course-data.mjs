import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';

const siteDir = dirname(fileURLToPath(import.meta.url));
const outputsDir = resolve(siteDir, '..');
const dataPath = join(siteDir, 'course-204-data.js');

const seniorVoices = [
  'Experienced designers',
  'At senior level, designers',
  'Mature product teams',
  'Strong design leaders',
];

function polishForReading(markdown, id) {
  const lessonNumber = Number(id.slice(3));
  return markdown
    .split('\n')
    .map((line) => {
      if (line.startsWith('# ')) return line;
      return line
        .replace(/(\*[^*]+\*)\s+[—–]\s+/g, '$1 by ')
        .replace(/\s+—\s+/g, ': ')
        .replace(/—/g, ', ')
        .replace(/(\d)\s*–\s*(\d)/g, '$1 to $2')
        .replace(/([A-Za-z])–([A-Za-z])/g, '$1 and $2')
        .replace(/\s+–\s+/g, ' to ')
        .replace(/\brather than\b/gi, 'instead of')
        .replace(/\bnot just ([^.;:]+?) but ([^.;:]+)/gi, '$1 and $2')
        .replace(/,\s*not just\s+/gi, ' as well as ')
        .replace(/\bnot just\s+/gi, 'more than ')
        .replace(/\bSenior practitioners\b/g, seniorVoices[lessonNumber % seniorVoices.length]);
    })
    .join('\n');
}

function plainText(markdown) {
  return markdown
    .split('\n')
    .filter((line) => !/^\s*(?:\||[-*]\s+|\d+\.\s+)/.test(line) && !/:\s*$/.test(line))
    .join('\n')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentences(markdown) {
  return plainText(markdown)
    .match(/[^.!?]+(?:[.!?]+[”"']?|$)/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [];
}

function shorten(sentence, limit = 190) {
  if (sentence.length <= limit) return sentence;
  const clipped = sentence.slice(0, limit + 1);
  const clean = clipped.slice(0, Math.max(clipped.lastIndexOf(' '), limit - 28)).replace(/[,:;\s]+$/, '');
  return `${clean}…`;
}

function section(markdown, headingPattern) {
  const match = markdown.match(new RegExp(`^##[ \\t]+${headingPattern}[ \\t]*\\r?\\n([\\s\\S]*?)(?=^##[ \\t]+|(?![\\s\\S]))`, 'im'));
  return match?.[1].trim() ?? '';
}

function buildComic(markdown) {
  const carePath = section(markdown, '[^\\n]*CarePath[^\\n]*');
  const carePathSentences = sentences(carePath);
  const usefulSentences = carePathSentences.filter((sentence) => sentence.length > 28 && !/:$/.test(sentence));
  const scene = usefulSentences[0]
    || 'A CarePath decision brings this lesson into the real service.';
  const notice = usefulSentences.find((sentence) => sentence !== scene && /\bAlex\s+(?:asks|notices|finds|sees|realises|learns|traces|maps|tests|reviews)\b/i.test(sentence))
    || usefulSentences.find((sentence) => sentence !== scene && /\bAlex\b/i.test(sentence))
    || usefulSentences[1]
    || 'Alex looks past the screen to understand what is shaping the experience.';
  const change = usefulSentences.find((sentence) => sentence !== scene && sentence !== notice && /\b(?:team|decision|design|changes?|result|artifact|records?|replaces?|adds?|removes?|tests?|builds?|keeps?|moves?)\b/i.test(sentence))
    || usefulSentences.find((sentence) => sentence !== scene && sentence !== notice)
    || 'The finding changes the next CarePath design decision.';

  return {
    scene: shorten(scene),
    notice: shorten(notice),
    change: shorten(change),
  };
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sourceFiles = [join(outputsDir, 'v1-lessons'), join(outputsDir, 'v2-lessons')]
  .flatMap(walk)
  .filter((path) => /\/UX-\d{3}-.+\.md$/.test(path));

const chapters = {};
const comics = {};
const titles = {};
for (const path of sourceFiles) {
  const markdown = readFileSync(path, 'utf8').trim();
  const heading = markdown.match(/^#\s+(UX-\d{3})\s+[—-]\s+(.+)$/m);
  const frontmatterId = markdown.match(/^id:\s*(UX-\d{3})\s*$/m)?.[1];
  const frontmatterTitle = markdown.match(/^title:\s*(.+?)\s*$/m)?.[1];
  const plainTitle = markdown.match(/^#\s+(.+?)\s*$/m)?.[1];
  const id = heading?.[1] ?? frontmatterId;
  const title = heading?.[2] ?? frontmatterTitle ?? plainTitle;
  if (!id || !title) throw new Error(`Missing lesson identity: ${path}`);
  if (chapters[id]) throw new Error(`Duplicate lesson id: ${id}`);
  const lessonBody = markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '').trim();
  chapters[id] = polishForReading(lessonBody, id);
  comics[id] = buildComic(chapters[id]);
  titles[id] = polishForReading(title.trim(), id).replace(/\s+as well as\s+/i, ': Beyond ');
}

const existing = readFileSync(dataPath, 'utf8');
const encoded = existing.match(/^window\.course204Gzip="([A-Za-z0-9+/=]+)";/)?.[1];
if (!encoded) throw new Error('Could not read the current course index');
const previous = JSON.parse(gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8'));

const indexedIds = [];
for (const module of Object.values(previous.index)) {
  module.lessons = module.lessons.map(([id]) => {
    if (!chapters[id]) throw new Error(`Indexed lesson has no source: ${id}`);
    indexedIds.push(id);
    return [id, titles[id]];
  });
}

const sourceIds = Object.keys(chapters).sort();
const missingFromIndex = sourceIds.filter((id) => !indexedIds.includes(id));
const duplicatedInIndex = indexedIds.filter((id, i) => indexedIds.indexOf(id) !== i);
if (sourceIds.length !== 204 || indexedIds.length !== 204 || missingFromIndex.length || duplicatedInIndex.length) {
  throw new Error(JSON.stringify({ sourceCount: sourceIds.length, indexCount: indexedIds.length, missingFromIndex, duplicatedInIndex }));
}

const payload = JSON.stringify({ index: previous.index, chapters, comics });
const compressed = gzipSync(Buffer.from(payload), { level: 9, mtime: 0 }).toString('base64');
writeFileSync(dataPath, `window.course204Gzip="${compressed}";\n`);
console.log(`Built ${sourceIds.length} complete lessons (${payload.length.toLocaleString()} source bytes).`);
