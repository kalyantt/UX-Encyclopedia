import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync,gzipSync} from 'node:zlib';
import {readingModel,modules} from './learning-design.mjs';
import {quizzes} from './quiz-bank.mjs';

const encoded=readFileSync(new URL('./course-204-data.js',import.meta.url),'utf8').match(/^window\.course204Gzip="([A-Za-z0-9+/=]+)";/)?.[1];
if(!encoded)throw new Error('Published course data unavailable');
const course=JSON.parse(gunzipSync(Buffer.from(encoded,'base64')));
const editorialReport=JSON.parse(readFileSync(new URL('../v3-lessons/editorial-review.json',import.meta.url),'utf8'));
const challengeOpenings={
  M01:'A completed form is not necessarily a completed goal. Judge a proposed booking change through task success, felt confidence, service delivery, and the evidence still missing.',
  M02:'A correct message can fail if it is missed, misunderstood, or arrives too late. Examine how perception, attention, cognition, and action shape a consequential product choice.',
  M03:'A screen flow is only one representation of work. Trace goals, tasks, mental models, interruptions, and recovery before deciding what the product should show.',
  M04:'A research plan earns its place when evidence can still change a decision. Match methods to uncertainty, recruit for the conditions that matter, and state what each finding can support.',
  M05:'Discovery links opportunities to real outcomes. Compare product ideas against the problem they claim to solve, then keep learning as delivery changes the situation.',
  M06:'Research becomes useful when patterns can guide a decision without flattening variation. Build models and stories that keep evidence, context, and limits visible.',
  M07:'Information structure shapes what people can find and understand. Inspect the content, relationships, labels, navigation, and search recovery behind a real task.',
  M08:'Words are part of the interface. Decide what people need to know, when they need it, and how content can support action, comprehension, and recovery.',
  M09:'Interaction patterns carry assumptions about state, choice, and consequence. Evaluate how controls behave through the normal path and when things go wrong.',
  M10:'A design system is a product with users, governance, and maintenance. Test whether shared foundations improve coherent decisions instead of merely standardising appearance.',
  M11:'A service promise depends on touchpoints, people, policies, data, and backstage capacity. Follow the full journey and identify who can repair broken handoffs.',
  M12:'Prototypes and evaluations are tools for learning. Choose the representation and method that expose the uncertainty before a consequential decision is locked in.',
  M13:'A metric is a claim about behaviour, not a verdict. Trace its definition and causal path, then use diagnostics and guardrails to judge a proposed change.',
  M14:'An apparently successful path can still exclude people or transfer harm. Test complete tasks across varied capabilities and contexts, with a real route to remedy.',
  M15:'An AI feature changes authority, uncertainty, and recovery. Compare it with a non-AI baseline and define what the system may do when its answer is wrong or stale.',
  M16:'A design decision becomes valuable only when the organisation can deliver, measure, and maintain it. Make ownership, trade-offs, and stop conditions explicit.',
  M17:'A complete design case connects a problem frame, evidence, alternatives, service conditions, evaluation, and the decision that should follow. Defend both the choice and its limits.',
};
const neutralize=value=>typeof value==='string'?value
  .replace(/Maya’s/g,"the person's").replace(/Alex’s/g,"the designer's").replace(/CarePath’s/g,"the service's")
  .replace(/\bMaya\b/g,'the person').replace(/\bAlex\b/g,'the designer').replace(/\bCarePath\b/g,'the service')
  :Array.isArray(value)?value.map(neutralize):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,item])=>[key,neutralize(item)])):value;
for(const [mid,module] of Object.entries(modules))course.modules[mid]={...neutralize(module),story:challengeOpenings[mid]};
if(Object.values(course.modules).some(module=>!module.story))throw new Error('A chapter opening is missing');
for(const {id,target} of editorialReport){
  const markdown=readFileSync(target,'utf8');
  if(/\b(?:Alex|Maya|CarePath)\b/.test(markdown))throw new Error(`${id} still contains the old character story`);
  const title=markdown.match(/^title:\s*(.+)$/m)?.[1];
  const reading=readingModel(markdown,id,title);
  if(!reading.example||!reading.opening)throw new Error(`${id} needs an opening and product example`);
  course.chapters[id]=markdown;
  course.reading[id]=reading;
  course.quizzes[id]=quizzes[id];
}
const compressed=gzipSync(Buffer.from(JSON.stringify(course)),{level:9,mtime:0}).toString('base64');
writeFileSync(new URL('./course-204-data-editorial-preview.js',import.meta.url),`window.course204Gzip="${compressed}";\n`);
const html=readFileSync(new URL('./course.html',import.meta.url),'utf8')
  .replace('course-204-data.js?v=20261001b','course-204-data-editorial-preview.js?v=editorial-all1')
  .replace(/course-reader\.js\?v=[^"]+/,'course-reader.js?v=editorial-all8')
  .replace(/course-reader\.css\?v=[^"]+/,'course-reader.css?v=20261021v7')
  .replace(/reading-pet\.css\?v=[^"]+/,'reading-pet.css?v=20261021v6')
  .replace('<a href="case.html">The CarePath story ↗</a>','')
  .replace('<title>UX Encyclopedia · The course</title>','<title>Editorial preview · UX Encyclopedia</title>');
writeFileSync(new URL('./course-editorial-preview.html',import.meta.url),html);
const podcastEdition=html
  .replace('<title>Editorial preview · UX Encyclopedia</title>','<title>Podcast edition · UX Encyclopedia</title>')
  .replace('Learn UX through connected stories, practical challenges, and the CarePath case.','Learn UX through connected lessons, product examples, challenges, and offline two-voice podcasts.')
  .replace('<a href="index.html">← Course home</a>','<a href="course.html">← Earlier course</a>')
  .replace('<p class="local-note">Your practice progress stays in this browser. No account needed.</p>','');
writeFileSync(new URL('./course-podcast-v1.html',import.meta.url),podcastEdition);
console.log(`Built local editorial preview for ${editorialReport.length} lessons; it is not the published course.`);
