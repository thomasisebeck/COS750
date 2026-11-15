import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync(new URL('../src/components/Lesson5Experience.tsx', import.meta.url), 'utf8');

test('Lesson 5 retry keeps the same question instead of regenerating one', () => {
  assert.match(component, /const page = practice\.pages\[index\]/);
  assert.match(component, /buttonLabel = "Try again"/);
  assert.doesNotMatch(component, /guidedSimilarQuestion|setRetryPages|setSimilarAttempt|Try a similar question/);
  assert.match(component, /Keep the original question and graph[\s\S]*?setSelected\(null\);[\s\S]*?setQuizChecked\(false\);/);
});
