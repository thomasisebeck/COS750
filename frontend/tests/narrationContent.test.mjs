import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { collectLessonNarration } from '../src/components/lessonNarration.ts';

test('Listen reads instructional body, graph description, choices and shown feedback',()=>{
 const dom=new JSDOM(`<div class="pf-screen pf-lesson-screen"><div class="flex-1 flex flex-col">
 <header class="pf-page-title"><h1>Who is next to A?</h1><button id="listen">Listen</button><p>Look at the connections.</p></header>
 <svg class="pf-graph-svg" aria-label="Undirected graph: A connected to B and A connected to C"></svg>
 <h3 class="pf-quiz-question">Which vertices are adjacent to A?</h3>
 <button class="pf-option-card"><span class="pf-option-label">B</span></button>
 <button class="pf-option-card"><span class="pf-option-label">B and C</span></button>
 <div class="pf-info-card"><strong>Try again</strong><p>Follow the edge directly.</p></div>
 </div><button>Next</button></div>`);
 const speech=collectLessonNarration(dom.window.document.getElementById('listen'));
 for(const phrase of ['Who is next to A','Look at the connections','Undirected graph','Which vertices','B and C','Follow the edge directly']) assert.ok(speech.includes(phrase),phrase);
 assert.ok(!speech.includes('Next'));
});

test('Listen reads exploratory route options and visible discoveries',()=>{
 const dom=new JSDOM(`<div class="pf-screen pf-lesson-zero"><main class="pf-zero-main">
 <header class="pf-page-title"><h1>Which way would you go?</h1><button id="listen">Listen</button></header>
 <div class="pf-zero-story">A is home and D is the shops.</div>
 <div class="pf-zero-route-choices"><button><strong>Past the library</strong>7 min</button></div>
 <p class="pf-zero-discovery">You found a different route.</p>
 </main></div>`);
 const speech=collectLessonNarration(dom.window.document.getElementById('listen'));
 assert.match(speech,/home and D is the shops/);
 assert.match(speech,/Past the library/);
 assert.match(speech,/different route/);
});
