import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {quizzes} from './quiz-bank.mjs';
const encoded=readFileSync(new URL('./course-204-data.js',import.meta.url),'utf8').match(/="([^"]+)"/)[1];
const data=JSON.parse(gunzipSync(Buffer.from(encoded,'base64')));
let chapters=0;
for(const [id] of Object.values(data.index).flatMap(m=>m.lessons)){
  const questions=quizzes[id];assert.ok(questions,id);assert.equal(questions.length,4);assert.equal(new Set(questions.map(q=>q.prompt)).size,4);
  for(const q of questions){assert.ok(q.options.length>=2);assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.correct>=0&&q.correct<q.options.length);assert.ok(q.explanation.length>30)}assert.deepEqual(data.quizzes[id],questions);
}
for(const m of Object.values(data.index)){
  const ids=Array.from({length:6},(_,i)=>m.lessons[Math.floor(i*(m.lessons.length-1)/5)][0]);
  assert.equal(new Set(ids).size,6);ids.forEach(id=>assert.ok(quizzes[id]));chapters++;
}
assert.equal(Object.keys(quizzes).length,204);assert.equal(chapters,17);
assert.ok(!readFileSync(new URL('./course-reader.js',import.meta.url),'utf8').includes('<textarea'));
console.log('Verified 816 questions across 204 lessons, 17 six-question chapter reviews, answer keys, and no written-answer fields.');
