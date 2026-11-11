import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeDijkstraTrace, shortestRoute, LESSON4_VERTICES, LESSON4_EDGES } from '../src/algorithms/dijkstra.ts';

const steps = computeDijkstraTrace();
const pages = JSON.parse(readFileSync(new URL('../src/lessons/lesson-4.json', import.meta.url), 'utf8')).pages;

test('Lesson 4 exactly follows the ten supplied screens', () => {
  assert.equal(pages.length, 10);
  assert.deepEqual(pages.map(p => p.title), [
    'Meet Dijkstra', 'Start at zero', 'Choose the closest', 'Improve neighbours',
    'Who is next?', 'Better way to B', 'Improve D again', 'Reconstruct the path',
    'When not to use it', 'Dijkstra unlocked',
  ]);
});

test('initial state starts at 0 for A and infinity for the rest', () => {
  assert.deepEqual(steps[0].settled, []);
  assert.equal(steps[0].distances.A, 0);
  for (const v of ['B','C','D']) assert.equal(steps[0].distances[v], Infinity);
});

test('settles vertices A, C, B, D in increasing cost order', () => {
  assert.deepEqual(steps.slice(1).map(step => step.current), ['A', 'C', 'B', 'D']);
});

test('relaxing A gives tentative costs 4 and 2', () => {
  assert.equal(steps[1].distances.B, 4);
  assert.equal(steps[1].distances.C, 2);
  assert.equal(steps[1].predecessors.B, 'A');
  assert.equal(steps[1].predecessors.C, 'A');
});

test('relaxing C improves B from 4 to 3 and discovers D at 8', () => {
  assert.equal(steps[2].distances.B, 3);
  assert.equal(steps[2].predecessors.B, 'C');
  assert.equal(steps[2].distances.D, 8);
  assert.equal(steps[2].predecessors.D, 'C');
});

test('relaxing B improves D from 8 to 6', () => {
  assert.equal(steps[3].distances.D, 6);
  assert.equal(steps[3].predecessors.D, 'B');
});

test('final shortest path is A → C → B → D with cost 6', () => {
  assert.deepEqual(shortestRoute(steps[4], 'D'), ['A','C','B','D']);
  assert.equal(steps[4].distances.D, 6);
});

test('quiz checks the smallest unsettled cost', () => {
  const quiz = pages.find(p => p.type === 'quiz');
  assert.equal(quiz.correctAnswerId, 'C');
  assert.equal(steps[1].distances.C, Math.min(steps[1].distances.B, steps[1].distances.C, steps[1].distances.D));
});

test('rejects negative weights and invalid edges', () => {
  assert.throws(() => computeDijkstraTrace(LESSON4_VERTICES, [...LESSON4_EDGES, {id:'bad', source:'A', target:'D', weight:-1}]), /non-negative/);
  assert.throws(() => computeDijkstraTrace(LESSON4_VERTICES, [...LESSON4_EDGES, {id:'bad', source:'A', target:'D', weight:NaN}]), /finite/);
  assert.throws(() => computeDijkstraTrace(LESSON4_VERTICES, [...LESSON4_EDGES, {id:'bad', source:'A', target:'A', weight:1}]), /different/);
});

test('unreachable destination has infinite cost and no reconstructed route', () => {
  const disconnected = computeDijkstraTrace(LESSON4_VERTICES, [{id:'AB',source:'A',target:'B',weight:4}]);
  assert.equal(disconnected.at(-1).distances.D, Infinity);
  assert.equal(shortestRoute(disconnected.at(-1), 'D'), null);
});
