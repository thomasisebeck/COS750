import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lesson = JSON.parse(readFileSync(new URL('../src/lessons/lesson-3.json', import.meta.url), 'utf8'));
const graph = lesson.pages[1].contentBox.state;
const costOf = (ids) => ids.slice(1).reduce((sum, id, index) => {
  const previous = ids[index];
  const edge = graph.edges.find(({ source, target }) =>
    (source === previous && target === id) || (source === id && target === previous));
  assert.ok(edge, `No edge between ${previous} and ${id}`);
  return sum + Number(edge.label);
}, 0);

test('Lesson 3 includes all eight design-aligned steps', () => {
  assert.equal(lesson.meta.lessonNumber, 3);
  assert.equal(lesson.pages.length, 8);
  assert.deepEqual(lesson.pages.map(({ title }) => title), [
    'Weigh Your Options', 'Every edge has a weight', 'Add the weights',
    'Which route wins?', 'Fewest edges or least cost?', 'Calculate a path cost',
    "Add, don't count", "You've got the weights!",
  ]);
});

test('Every weighted diagram uses the same five, undirected connections', () => {
  const reference = graph.edges.map((edge) => `${edge.source}-${edge.target}:${edge.label}`);
  assert.deepEqual(reference, ['A-B:4', 'A-C:2', 'B-C:1', 'B-D:3', 'C-D:6']);
  for (const page of lesson.pages) {
    if (!('state' in page.contentBox)) continue;
    assert.deepEqual(page.contentBox.state.edges.map((edge) => `${edge.source}-${edge.target}:${edge.label}`), reference);
    assert.equal(page.contentBox.state.nodes.length, 4);
  }
});

test('The cheaper-route worked example and answer are correct', () => {
  const fast = costOf(['A', 'C', 'B', 'D']);
  const fewestEdges = costOf(['A', 'B', 'D']);
  assert.equal(fast, 6);
  assert.equal(fewestEdges, 7);
  assert.ok(fast < fewestEdges);
  const quiz = lesson.pages[3].contentBox;
  assert.equal(quiz.boxType, 'graph-quiz');
  assert.equal(quiz.correctAnswerId, 'route-acbd');
  assert.ok(quiz.options.some((option) => option.id === quiz.correctAnswerId));
});

test('Quick-check total and marked answer are correct', () => {
  assert.equal(costOf(['A', 'B', 'C', 'D']), 11);
  const quiz = lesson.pages[5].contentBox;
  assert.equal(quiz.boxType, 'graph-quiz');
  assert.equal(quiz.correctAnswerId, 'cost-11');
  assert.ok(quiz.options.some((option) => option.id === quiz.correctAnswerId));
});

// The retry logic is kept separate from React so questions can be verified
// against the exact graphs students will see.
import { generateRetryQuestion, highlightedRoute, pathCost, quizExplanation } from '../src/lessons/lesson3Questions.ts';

const routeQuiz = lesson.pages[3].contentBox;
const totalQuiz = lesson.pages[5].contentBox;
const graphSignature = ({ state }) => state.edges.map((edge) => edge.label).join(',');

test('Both quizzes describe their retry rules in lesson-3.json', () => {
  assert.equal(routeQuiz.retryGenerator.kind, 'compare-routes');
  assert.equal(totalQuiz.retryGenerator.kind, 'path-cost');
  assert.deepEqual(routeQuiz.retryGenerator.routes.map(({ path }) => path), [
    ['A', 'B', 'D'], ['A', 'C', 'B', 'D'],
  ]);
  assert.deepEqual(totalQuiz.retryGenerator.path, ['A', 'B', 'C', 'D']);
});

test('New route-comparison questions change the graph and recompute the right answer', () => {
  let previous = routeQuiz;
  for (let attempt = 1; attempt <= 100; attempt++) {
    const question = generateRetryQuestion(routeQuiz, previous, attempt);
    assert.notEqual(graphSignature(question), graphSignature(previous));
    const [first, second] = question.retryGenerator.routes;
    const firstTotal = pathCost(question.state, first.path);
    const secondTotal = pathCost(question.state, second.path);
    assert.notEqual(firstTotal, secondTotal);
    assert.equal(question.correctAnswerId, firstTotal < secondTotal ? first.optionId : second.optionId);
    assert.deepEqual(new Set(question.options.map(({ id }) => id)),
      new Set([first.optionId, second.optionId, question.retryGenerator.tieOptionId]));
    assert.match(quizExplanation(question), new RegExp(String(firstTotal)));
    assert.match(quizExplanation(question), new RegExp(String(secondTotal)));
    previous = question;
  }
});

test('Path-cost retries produce new graphs and three distinct answers', () => {
  let previous = totalQuiz;
  for (let attempt = 1; attempt <= 100; attempt++) {
    const question = generateRetryQuestion(totalQuiz, previous, attempt);
    assert.notEqual(graphSignature(question), graphSignature(previous));
    const total = pathCost(question.state, totalQuiz.retryGenerator.path);
    assert.equal(question.correctAnswerId, `cost-${total}`);
    assert.equal(question.options.length, 3);
    assert.equal(new Set(question.options.map(({ id }) => id)).size, 3);
    assert.equal(question.options.find(({ id }) => id === question.correctAnswerId)?.label, String(total));
    assert.ok(!question.options.every(({ id }, index) => id === previous.options[index]?.id));
    previous = question;
  }
});

test('Retry generator also changes graphs with a constant random source', () => {
  for (const template of [routeQuiz, totalQuiz]) {
    let previous = template;
    for (let attempt = 1; attempt <= 20; attempt++) {
      const next = generateRetryQuestion(template, previous, attempt, () => 0);
      assert.notEqual(graphSignature(next), graphSignature(previous));
      previous = next;
    }
  }
});

test('Route selection highlights the exact connecting edges on the live graph', () => {
  const graph = highlightedRoute(routeQuiz.state, ['A', 'C', 'B', 'D']);
  assert.deepEqual(graph.highlightedNodes, ['A', 'C', 'B', 'D']);
  assert.deepEqual(graph.highlightedEdges, ['AC', 'BC', 'BD']);
});

test('Lesson 3 displays the shared LiveGraph component, not a separate graph component', () => {
  const source = readFileSync(new URL('../src/components/Lesson3Experience.tsx', import.meta.url), 'utf8');
  assert.match(source, /import \{ LiveGraph \} from "\.\/LiveGraph"/);
  assert.match(source, /<LiveGraph\s/);
  assert.doesNotMatch(source, /WeightedGraph/);
});


test('JSON edge sets can generate a different topology as well as different weights', () => {
  for (const original of [routeQuiz, totalQuiz]) {
    const firstRetry = generateRetryQuestion(original, original, 1, () => 0.4);
    const secondRetry = generateRetryQuestion(original, firstRetry, 2, () => 0.4);
    assert.equal(firstRetry.state.edges.length, 4);
    assert.equal(secondRetry.state.edges.length, 5);
    assert.notDeepEqual(firstRetry.state.edges.map(({ id }) => id), secondRetry.state.edges.map(({ id }) => id));
  }
});
