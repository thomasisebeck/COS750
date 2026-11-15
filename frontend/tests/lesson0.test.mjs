import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lesson = JSON.parse(readFileSync(new URL('../src/lessons/lesson-0.json', import.meta.url), 'utf8'));

test('lesson zero gives a novice conceptual context before technical instruction', () => {
  assert.equal(lesson.meta.lessonNumber, 0);
  assert.deepEqual(lesson.pages.map((page) => page.type), ['contexts', 'ready', 'map']);
  assert.ok(lesson.pages.every((page) => page.title && page.subtext && page.buttonLabel));
  assert.ok(lesson.pages.every((page) => page.title.length < 50 && page.subtext.length < 120));
});

test('lesson zero activates familiar situations without preteaching definitions', () => {
  assert.equal(lesson.contexts.length, 3);
  assert.ok(lesson.contexts.some((context) => context.id === 'routes'));
  for (const context of lesson.contexts) {
    assert.ok(context.description.length > 35);
    assert.ok(!/vertices|edges/i.test(context.description));
    assert.ok(context.question.endsWith('?'));
  }
});

test('lesson zero uses the shared graph and explicitly locates shortest paths in the larger topic', () => {
  const component = readFileSync(new URL('../src/components/Lesson0Experience.tsx', import.meta.url), 'utf8');
  assert.ok(component.includes('LiveGraph'));
  assert.ok(component.includes('Shortest paths'));
  assert.ok(component.includes('Topological sorting'));
  assert.ok(component.includes('Minimum spanning trees'));
  assert.ok(component.includes('Network flow'));
});


test('lesson zero replaces formal questions with ungraded exploration', () => {
  const component = readFileSync(new URL('../src/components/Lesson0Experience.tsx', import.meta.url), 'utf8');
  assert.ok(component.includes('pf-zero-route-choices'));
  assert.ok(lesson.pages[1].subtext.includes('no wrong answers'));
  assert.ok(!component.includes('miniChecks'));
  assert.ok(!component.includes('correctAnswerId'));
});
