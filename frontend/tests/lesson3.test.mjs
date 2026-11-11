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
