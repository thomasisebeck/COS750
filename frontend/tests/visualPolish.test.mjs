import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root = new URL('../', import.meta.url);
function source(path) {return readFileSync(new URL(path,root),'utf8');}

test('Homepage graph rules do not stretch every nested SVG icon', () => {
  const css = source('src/App.css');
  assert.doesNotMatch(css,/\.pf-hero-illustration svg\s*\{/);
  assert.match(css,/\.pf-hero-illustration \.pf-live-help\s*\{display:none;/);
  assert.match(css,/\.pf-hero-illustration \.pf-graph-svg/);
});

test('Lesson 0 graph piano note is shared across lessons without replacing answer cues', () => {
  const helpers=source('src/helpers.ts');
  assert.match(helpers,/playNoteSound\s*=\s*\(count:[^)]*\)[\s\S]*?playPianoNote\(/);
  assert.match(helpers,/playFeedbackSound\s*=\s*\(correct:/);
  for(const lesson of [1,2,3,4,5,6]) {
    assert.match(source(`src/components/Lesson${lesson}Experience.tsx`),/playNoteSound\(/);
  }
});

test('Leaderboard displays fictional rankings without a promotional placeholder badge', () => {
  const leaderboard=source('src/components/Leaderboard.tsx');
  assert.doesNotMatch(leaderboard,/>DEMO</);
  assert.match(leaderboard,/Practice scores are fictional/);
  assert.match(leaderboard,/cannot be redeemed/);
});
