import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareNarrationText } from '../src/components/prepareNarration.ts';

// No emoji labels should reach either speech engine, including compound emojis.
test('narration skips decorative emojis but keeps lesson explanations', () => {
  assert.equal(
    prepareNarrationText('🎉 Correct! 🏆 You found A → B → D. 💡 Great work!'),
    'Correct! You found A to B to D. Great work!',
  );
  assert.equal(
    prepareNarrationText('🧑🏽‍🏫 Try another route. 🚴‍♀️ 🌍 🇿🇦'),
    'Try another route.',
  );
});

test('narration preserves meaningful numeric labels and maths', () => {
  assert.equal(prepareNarrationText('1️⃣ Find the shortest path. 2️⃣ Cost = 5 + 3.'), '1 Find the shortest path. 2 Cost = 5 + 3.');
  assert.equal(prepareNarrationText('A ↔ B, distance ≤ 4; A → C.'), 'A in both directions B, distance ≤ 4; A to C.');
  assert.equal(prepareNarrationText('🎯 ⭐ 🏅'), '');
});
