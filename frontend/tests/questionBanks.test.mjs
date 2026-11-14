import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lesson1Retry, lesson1FollowUp, lesson2Retry, guidedPracticeBank, guidedSimilarQuestion, assessmentBank } from '../src/lessons/questionBanks.ts';

const load = (i) => JSON.parse(readFileSync(new URL(`../src/lessons/lesson-${i}.json`,import.meta.url),'utf8'));
const edgeCost = (state,a,b) => Number(state.edges.find(e => e.source===a&&e.target===b || e.source===b&&e.target===a)?.label);
const selected = (quiz) => quiz.options.find(o => o.id===quiz.correctAnswerId)?.label;

test('Lesson 1 regenerated quizzes always use the displayed graph facts', () => {
 for (let attempt=1;attempt<=20;attempt++) {
  const count = lesson1Retry(2,attempt);
  assert.equal(selected(count),`${count.state.nodes.length} vertices`);
  const adjacency = lesson1Retry(4,attempt);
  const neighbours = adjacency.state.edges.filter(edge=>edge.source==='A').map(edge=>edge.target).join(' and ');
  assert.equal(selected(adjacency),neighbours);
 }
});

test('Lesson 2 arrow and answer agree across retries', () => {
 for (let attempt=1;attempt<=12;attempt++) {
  const q=lesson2Retry(attempt), edge=q.state.edges[0];
  assert.equal(selected(q),`${edge.source} to ${edge.target} only`);
 }
});

test('Lesson 5 full sequence and its remedial prompts compute from one weighted graph', () => {
 for (let attempt=1;attempt<=40;attempt++) {
  const lesson=guidedPracticeBank(load(5),attempt);
  const g=lesson.pages[0].contentBox.state;
  const ab=edgeCost(g,'A','B'), ac=edgeCost(g,'A','C'), bc=edgeCost(g,'B','C');
  const bd=edgeCost(g,'B','D'), cd=edgeCost(g,'C','D');
  assert.ok(ab+bc<ac);
  assert.ok(ab+bc+cd<ab+bd);
  assert.equal(lesson.pages[2].options.find(o=>o.id===lesson.pages[2].correctAnswerId).label,String(ab));
  assert.match(selected({options:lesson.pages[8].options,correctAnswerId:lesson.pages[8].correctAnswerId}),new RegExp(String(ab+bc+cd)));
  for(let page=1;page<=8;page++) {
   const q=guidedSimilarQuestion(lesson,page,2);
   assert.ok(q.options.some(option=>option.id===q.correctAnswerId));
   assert.notEqual(q.cardTitle,lesson.pages[page].cardTitle);
  }
 }
});

test('Lesson 6 graded key and costs are internally consistent across generated assessments', () => {
 for(let attempt=1;attempt<=40;attempt++) {
  const a=assessmentBank(load(6),attempt);
  const g=a.pages[0].contentBox.state;
  const ac=edgeCost(g,'A','C'),bc=edgeCost(g,'B','C'),bd=edgeCost(g,'B','D');
  const cost=ac+bc+bd;
  assert.equal(selected(a.pages[3].contentBox),String(cost));
  assert.match(selected(a.pages[9].contentBox),new RegExp(String(cost)));
  assert.equal(a.pages.filter(p=>['quiz','graph-quiz'].includes(p.contentBox?.boxType)).length,10);
  assert.ok(a.pages.every(p=>!['quiz','graph-quiz'].includes(p.contentBox?.boxType)||p.contentBox.options.some(o=>o.id===p.contentBox.correctAnswerId)));
  const arrow=a.pages[2].contentBox;
  const direction=arrow.state.edges[0];
  assert.equal(selected(arrow),`${direction.source} to ${direction.target} only`);
 }
});

test('practice leaderboard is beatable, and ties do not falsely win the voucher', async () => {
 const {rankAssessment} = await import('../src/lessons/rewards.ts');
 assert.equal(rankAssessment(9).firstPlace,false);
 assert.equal(rankAssessment(10).firstPlace,true);
 assert.equal(rankAssessment(10).ranks[0].name,'You');
 assert.equal(rankAssessment(9).ranks[0].name,'Lerato');
 assert.equal(rankAssessment(0).ranks.at(-1).name,'You');
});


test('Lesson 1 vertex retry persists as the correct adjacency follow-up', () => {
 const generated=lesson1Retry(2,3);
 const following=lesson1FollowUp(generated.state,3);
 assert.strictEqual(following.state,generated.state);
 assert.equal(selected(following),generated.state.edges.filter(edge=>edge.source==='A').map(edge=>edge.target).join(', '));
});
