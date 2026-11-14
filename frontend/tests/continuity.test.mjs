import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { continuePathCostQuestion, generateRetryQuestion, pathCost } from '../src/lessons/lesson3Questions.ts';
import { makeInitialLesson4Question, generateNextVertexRetry } from '../src/lessons/lesson4Questions.ts';
import { shortestRoute } from '../src/algorithms/dijkstra.ts';

const lesson3 = JSON.parse(readFileSync(new URL('../src/lessons/lesson-3.json', import.meta.url), 'utf8'));
const lesson4 = JSON.parse(readFileSync(new URL('../src/lessons/lesson-4.json', import.meta.url), 'utf8'));

test('lesson 3 continuation keeps the generated graph exactly, including changed topology', () => {
  const original = lesson3.pages[3].contentBox;
  const followOn = lesson3.pages[5].contentBox;
  const changed = generateRetryQuestion(original, original, 1, () => 0.42);
  const continued = continuePathCostQuestion(followOn, changed.state);
  assert.deepEqual(continued.state.nodes, changed.state.nodes);
  assert.deepEqual(continued.state.edges, changed.state.edges);
  assert.notDeepEqual(changed.state.edges, original.state.edges);
  assert.ok(continued.question.includes('on this same graph'));
  const cost = pathCost(continued.state, continued.retryGenerator.path);
  assert.equal(continued.correctAnswerId, `cost-${cost}`);
  assert.ok(continued.options.some((option) => option.id === continued.correctAnswerId));
});

test('lesson 4 reuses retry trace and reconstructs a correct route with retry weights', () => {
  const config = lesson4.pages.find((page) => page.type === 'quiz').retryGenerator;
  const first = makeInitialLesson4Question(config);
  const changed = generateNextVertexRetry(config, first, 1, () => 0.35);
  const completed = changed.trace[changed.trace.length - 1];
  const path = shortestRoute(completed, 'D');
  assert.ok(path);
  assert.equal(path[0], 'A');
  assert.equal(path[path.length - 1], 'D');
  const graphCost = path.slice(1).reduce((total, vertex, i) => {
    const previous = path[i];
    const edge = changed.edges.find((item) => (item.source === previous && item.target === vertex) || (item.source === vertex && item.target === previous));
    assert.ok(edge, `missing ${previous}-${vertex}`);
    return total + edge.weight;
  }, 0);
  assert.equal(graphCost, completed.distances.D);
  const component = readFileSync(new URL('../src/components/Lesson4Experience.tsx', import.meta.url), 'utf8');
  assert.ok(component.includes('const usePracticeGraph = isQuiz || continuingRetry'));
  assert.ok(component.includes('const activeTrace = usePracticeGraph ? quiz.trace : exampleTrace'));
  assert.ok(component.includes('const edges = usePracticeGraph ? quiz.edges : LESSON4_EDGES'));
});
