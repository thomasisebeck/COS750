import test from 'node:test';
import assert from 'node:assert/strict';
import {speechChunks} from '../src/components/speechChunks.ts';

test('long browser narration is chunked without losing instructional words',()=>{
  const message='Dijkstra uses neighbouring vertices. '.repeat(42);
  const parts=speechChunks(message,230);
  assert.ok(parts.length>3);
  assert.ok(parts.every(part=>part.length<=230));
  assert.equal(parts.join(' ').replace(/\s+/g,' ').trim(),message.replace(/\s+/g,' ').trim());
});

test('short narration stays a single utterance',()=>{
  assert.deepEqual(speechChunks('Follow this route. Then check your answer.'),['Follow this route. Then check your answer.']);
});
