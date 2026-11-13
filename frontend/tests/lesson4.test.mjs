import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeDijkstraTrace, shortestRoute, LESSON4_VERTICES, LESSON4_EDGES } from '../src/algorithms/dijkstra.ts';
import { makeInitialLesson4Question, generateNextVertexRetry, makeNextVertexQuestion, describeDistances } from '../src/lessons/lesson4Questions.ts';

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
  assert.equal(makeInitialLesson4Question(quiz.retryGenerator).correctAnswerId, 'C');
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


test('initial quiz reads graph weights and answers from the current Dijkstra trace', () => {
  const config = pages.find(p => p.type === 'quiz').retryGenerator;
  const quiz = makeInitialLesson4Question(config);
  assert.equal(quiz.correctAnswerId, 'C');
  assert.equal(quiz.frame.distances.B, 4);
  assert.equal(quiz.frame.distances.C, 2);
  assert.deepEqual(quiz.options.map(o => o.id), ['B', 'C', 'D']);
  assert.ok(quiz.explanation.includes('B = 4'));
  assert.ok(quiz.explanation.includes('C = 2'));
  assert.ok(quiz.explanation.includes('D = ∞'));
  assert.ok(!quiz.question.includes('C = 2'), 'question must not disclose the answer');
  assert.equal(describeDistances(quiz.frame), 'B = 4, C = 2, D = ∞');
});

test('retries change the graph and use matching computed answers', () => {
  const config = pages.find(p => p.type === 'quiz').retryGenerator;
  let previous = makeInitialLesson4Question(config);
  const answers = new Set([previous.correctAnswerId]);
  const shapes = new Set([previous.edges.map(e => e.id).join(',')]);
  for (let attempt = 1; attempt <= 80; attempt++) {
    const current = generateNextVertexRetry(config, previous, attempt, () => 0.5);
    assert.notEqual(current.signature, previous.signature);
    assert.deepEqual(current.frame, current.trace[config.snapshotIndex]);
    assert.equal(current.correctAnswerId, current.options.map(o => o.id)
      .filter(v => Number.isFinite(current.frame.distances[v]))
      .sort((a,b) => current.frame.distances[a] - current.frame.distances[b] || a.localeCompare(b))[0]);
    assert.ok(current.explanation.includes(`${current.correctAnswerId} is next`));
    answers.add(current.correctAnswerId);
    shapes.add(current.edges.map(e => e.id).join(','));
    previous = current;
  }
  assert.ok(answers.size >= 2, 'retry answer should not always be the same vertex');
  assert.ok(shapes.size >= 2, 'retry graph topology should sometimes change');
});

test('arbitrary valid graphs are scored by the algorithm instead of a fixed answer key', () => {
  const config = pages.find(p => p.type === 'quiz').retryGenerator;
  const graph = LESSON4_EDGES.map(e => ({ ...e, weight: e.id === 'AB' ? 1 : 9 }));
  assert.equal(makeNextVertexQuestion(graph, config).correctAnswerId, 'B');
  const another = [...graph, { id:'AD', source:'A', target:'D', weight:0 }];
  assert.equal(makeNextVertexQuestion(another, config).correctAnswerId, 'D');
});

test('generator rejects impossible quiz settings instead of presenting an ambiguous answer', () => {
  const config = pages.find(p => p.type === 'quiz').retryGenerator;
  assert.throws(() => makeNextVertexQuestion(LESSON4_EDGES.map(e => ({ ...e, weight:1 })), config), /unique lowest/);
  assert.throws(() => generateNextVertexRetry({ ...config, weightRange: {min:4,max:4} }, makeInitialLesson4Question(config), 1), /range/);
});

test('Lesson 4 uses the shared LiveGraph and not the deprecated DijkstraGraph', () => {
  const source = readFileSync(new URL('../src/components/Lesson4Experience.tsx', import.meta.url),'utf8');
  assert.match(source, /<LiveGraph/);
  assert.doesNotMatch(source, /<DijkstraGraph/);
  assert.match(source, /isDirected={false}/);
  assert.match(source, /onNodeMove=/);
  assert.match(source, /Try a new graph/);
});
