import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { XP_PER_LESSON, normalizeCompletedLessons, totalExperience, rankAssessment } from '../src/lessons/rewards.ts';

const lesson = JSON.parse(readFileSync(new URL('../src/lessons/lesson-6.json', import.meta.url), 'utf8'));
const questionCount = lesson.pages.filter(page => ['quiz', 'graph-quiz'].includes(page.contentBox?.boxType)).length;

test('XP counts unique lessons only, regardless of order, replay or corrupt saved IDs', () => {
  assert.equal(XP_PER_LESSON,100);
  assert.deepEqual(normalizeCompletedLessons([6,6,0,2,7,-1,'5',null]),[0,2,6]);
  assert.equal(totalExperience([6,6,6]),100);
  assert.equal(totalExperience([6,1,3,1]),300);
  assert.equal(totalExperience([0,1,2,3,4,5,6]),700);
  assert.equal(totalExperience([]),0);
});

test('actual final grade has 14 questions, not 14 pages', () => {
  assert.equal(questionCount,14);
  assert.equal(lesson.pages.length,18);
  assert.equal(lesson.pages.find(p=>p.pageType==='results').title,'Your learning profile');
});

test('scores and first place use the actual graded question count', () => {
  assert.equal(rankAssessment(null,questionCount).ranks.length,5);
  assert.equal(rankAssessment(13,questionCount).firstPlace,false);
  assert.equal(rankAssessment(14,questionCount).firstPlace,true);
  assert.equal(rankAssessment(14,questionCount).ranks[0].score,14);
  assert.equal(rankAssessment(0,questionCount).ranks.at(-1).score,0);
});
