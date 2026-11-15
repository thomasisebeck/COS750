import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lesson1Retry, lesson1FollowUp, lesson2Retry, guidedPracticeBank, assessmentBank } from '../src/lessons/questionBanks.ts';

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

test('Lesson 5 guided sequence computes every answer from one weighted graph', () => {
 for (let attempt=1;attempt<=40;attempt++) {
  const lesson=guidedPracticeBank(load(5),attempt);
  const g=lesson.pages[0].contentBox.state;
  const ab=edgeCost(g,'A','B'), ac=edgeCost(g,'A','C'), bc=edgeCost(g,'B','C');
  const bd=edgeCost(g,'B','D'), cd=edgeCost(g,'C','D');
  assert.ok(ab+bc<ac);
  assert.ok(ab+bc+cd<ab+bd);
  assert.equal(lesson.pages[2].options.find(o=>o.id===lesson.pages[2].correctAnswerId).label,String(ab));
  assert.match(selected({options:lesson.pages[8].options,correctAnswerId:lesson.pages[8].correctAnswerId}),new RegExp(String(ab+bc+cd)));
  for (let page=1;page<=8;page++) {
   const question=lesson.pages[page];
   assert.ok(question.options.some(option=>option.id===question.correctAnswerId));
  }
 }
});

test('Lesson 6 graded key and costs are internally consistent across generated assessments', () => {
 for(let attempt=1;attempt<=40;attempt++) {
  const a=assessmentBank(load(6),attempt);
  const g=a.pages[0].contentBox.state;
  const ac=edgeCost(g,'A','C'),bc=edgeCost(g,'B','C'),bd=edgeCost(g,'B','D'),ab=edgeCost(g,'A','B');
  const cost=ac+bc+bd;
  assert.equal(selected(a.pages[3].contentBox),String(cost));
  assert.match(selected(a.pages[9].contentBox),new RegExp(String(cost)));
  assert.equal(selected(a.pages[11].contentBox),'A, B and D');
  assert.equal(selected(a.pages[12].contentBox),String(ab+bd));
  assert.equal(selected(a.pages[13].contentBox),'B');
  assert.equal(selected(a.pages[14].contentBox),String(ab+bd-cost));
  for (const page of a.pages.filter(p=>['quiz','graph-quiz'].includes(p.contentBox?.boxType))) {
    const q=page.contentBox;
    assert.equal(q.options.length,3,`Expected 3 unique options: ${page.title} (attempt ${attempt})`);
    assert.equal(new Set(q.options.map(option=>option.label)).size,3);
  }
  assert.equal(a.pages.filter(p=>['quiz','graph-quiz'].includes(p.contentBox?.boxType)).length,14);
  assert.ok(a.pages.every(p=>!['quiz','graph-quiz'].includes(p.contentBox?.boxType)||p.contentBox.options.some(o=>o.id===p.contentBox.correctAnswerId)));
  const arrow=a.pages[2].contentBox;
  const direction=arrow.state.edges[0];
  assert.equal(selected(arrow),`${direction.source} to ${direction.target} only`);
 }
});

test('practice leaderboard is beatable, and ties do not falsely win the voucher', async () => {
 const {rankAssessment} = await import('../src/lessons/rewards.ts');
 assert.equal(rankAssessment(13,14).firstPlace,false);
 assert.equal(rankAssessment(14,14).firstPlace,true);
 assert.equal(rankAssessment(14,14).ranks[0].name,'You');
 assert.equal(rankAssessment(13,14).ranks[0].name,'Lerato');
 assert.equal(rankAssessment(0,14).ranks.at(-1).name,'You');
 assert.equal(rankAssessment(null,14).ranks.length,5);
 assert.equal(rankAssessment(10,14).ranks.find(entry=>entry.name==='You').score,10);
 assert.equal(rankAssessment(100,14).ranks.find(entry=>entry.name==='You').score,14);
});


test('Lesson 1 vertex retry persists as the correct adjacency follow-up', () => {
 const generated=lesson1Retry(2,3);
 const following=lesson1FollowUp(generated.state,3);
 assert.strictEqual(following.state,generated.state);
 assert.equal(selected(following),generated.state.edges.filter(edge=>edge.source==='A').map(edge=>edge.target).join(', '));
});
