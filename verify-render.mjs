import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import vm from 'node:vm';

const siteDir = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(siteDir, 'course.html'), 'utf8');
const rendererSource = html.match(/(const esc=[\s\S]*?)function renderNav/)?.[1];
if (!rendererSource) throw new Error('Could not extract the live Markdown renderer');
const context = {};
vm.createContext(context);
vm.runInContext(`${rendererSource}\nglobalThis.renderLesson = markdown;`, context);

const dataSource = readFileSync(join(siteDir, 'course-204-data.js'), 'utf8');
const encoded = dataSource.match(/^window\.course204Gzip="([A-Za-z0-9+/=]+)";/)?.[1];
if (!encoded) throw new Error('Could not read built lesson data');
const data = JSON.parse(gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8'));

const failures = [];
let renderedTables = 0;
let renderedQuotes = 0;
let minimumText = Infinity;
for (const [id, markdown] of Object.entries(data.chapters)) {
  const rendered = context.renderLesson(markdown);
  const visibleText = rendered.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  minimumText = Math.min(minimumText, visibleText.length);
  renderedTables += (rendered.match(/<table>/g) || []).length;
  renderedQuotes += (rendered.match(/<blockquote>/g) || []).length;
  if (visibleText.length < 5000) failures.push(`${id}: rendered content is suspiciously short (${visibleText.length} characters)`);
  if (!/class="senior-head"/.test(rendered)) failures.push(`${id}: senior section was not rendered`);
  if (!/class="eye-head"/.test(rendered)) failures.push(`${id}: observation exercise was not rendered`);
  if (!/class="refs"/.test(rendered)) failures.push(`${id}: references were not rendered`);
  if (/^id:\s*UX-/m.test(visibleText)) failures.push(`${id}: internal frontmatter leaked into the lesson`);
  if (/\|\s*:?-{3,}/.test(visibleText)) failures.push(`${id}: Markdown table syntax leaked into the lesson`);
}

const indexed = Object.values(data.index).flatMap((module) => module.lessons);
if (indexed.length !== 204 || Object.keys(data.chapters).length !== 204) failures.push('Course does not contain 204 indexed chapters');

console.log(JSON.stringify({
  lessons: Object.keys(data.chapters).length,
  indexedLessons: indexed.length,
  renderedTables,
  renderedQuotes,
  minimumRenderedCharacters: minimumText,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
