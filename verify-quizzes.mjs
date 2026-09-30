import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {quizzes} from './quiz-bank.mjs';
const encoded=readFileSync(new URL('./course-204-data.js',import.meta.url),'utf8').match(/="([^"]+)"/)[1];
const data=JSON.parse(gunzipSync(Buffer.from(encoded,'base64')));
let chapters=0;
for(const [id] of Object.values(data.index).flatMap(m=>m.lessons)){
  const q=quizzes[id];assert.ok(q,id);assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert.ok(q.correct>=0&&q.correct<3);assert.ok(q.explanation.length>30);assert.deepEqual(data.quizzes[id],q);
}
for(const m of Object.values(data.index)){
  const ids=[m.lessons[0][0],m.lessons[Math.floor(m.lessons.length/2)][0],m.lessons.at(-1)[0]];
  assert.equal(new Set(ids).size,3);ids.forEach(id=>assert.ok(quizzes[id]));chapters++;
}
assert.equal(Object.keys(quizzes).length,204);assert.equal(chapters,17);
assert.ok(!readFileSync(new URL('./course-reader.js',import.meta.url),'utf8').includes('<textarea'));
console.log('Verified 204 lesson questions, 17 three-question chapter reviews, answer keys, and no written-answer fields.');
