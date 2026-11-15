import test from 'node:test';
import assert from 'node:assert/strict';
import { lesson1Retry, lesson1FollowUp } from '../src/lessons/questionBanks.ts';
import { adjacentVertices, edgesThroughUnrelatedVertices } from '../src/lessons/graphFacts.ts';
import { edgeDrawing } from '../src/components/graphGeometry.ts';

const answer = q => q.options.find(option=>option.id===q.correctAnswerId)?.label;

test('regression: a three-vertex graph cannot draw A-C directly through B',()=>{
  // Previous attempt 2: A(100,90), B(300,90), C(500,90) with A-C crossing B.
  const q=lesson1Retry(2,2);
  assert.equal(q.state.nodes.length,3);
  assert.deepEqual(edgesThroughUnrelatedVertices(q.state),[]);
  const followUp=lesson1FollowUp(q.state,2);
  assert.equal(answer(followUp), 'B, C');
  assert.match(followUp.explanation,/B, C/);
});

test('all generated Lesson 1 graphs keep graph, correct option and feedback consistent',()=>{
  for(let attempt=1;attempt<=120;attempt++) {
    for(const index of [2,4]) {
      const q=lesson1Retry(index,attempt);
      assert.deepEqual(edgesThroughUnrelatedVertices(q.state),[],`attempt ${attempt}, page ${index}`);
      assert.ok(q.options.some(option=>option.id===q.correctAnswerId));
      if(index===2) assert.equal(answer(q),`${q.state.nodes.length} vertices`);
      else {
        const neighbours=adjacentVertices(q.state,'A');
        assert.equal(answer(q),neighbours.join(' and '));
        assert.ok(q.explanation.includes(neighbours.join(' and ')));
      }
    }
    const state=lesson1Retry(2,attempt).state;
    const follow=lesson1FollowUp(state,attempt);
    assert.deepEqual(edgesThroughUnrelatedVertices(follow.state),[]);
    assert.equal(answer(follow),adjacentVertices(state,'A').join(', '));
  }
});

test('undirected adjacency counts both endpoints, not just source A',()=>{
  const state={nodes:[{id:'A'},{id:'B'},{id:'C'}],edges:[{id:'BA',source:'B',target:'A'},{id:'AC',source:'A',target:'C'}]};
  assert.deepEqual(adjacentVertices(state,'A'),['B','C']);
  assert.equal(answer(lesson1FollowUp(state,1)),'B, C');
});

test('shared renderer bends an edge when dragging makes it cross a third vertex',()=>{
  const a={id:'A',x:100,y:200}, b={id:'B',x:300,y:200}, c={id:'C',x:500,y:200};
  const curved=edgeDrawing(a,c,[a,b,c]);
  assert.ok(curved.curved);
  assert.ok(curved.d.includes(' Q '));
  assert.ok(Math.hypot(curved.labelX-b.x,curved.labelY-b.y)>27);
  const separated=edgeDrawing(a,c,[a,{...b,y:325},c]);
  assert.equal(separated.curved,false);
});
