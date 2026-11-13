import { describe, expect, it } from 'vitest';
import lesson from '../lessons/lesson-6.json';
import type { LessonData } from '../types/lesson';

// JSON imports widen discriminants to strings; validate the contract below.
const typedLesson: LessonData = lesson as LessonData;
const quizzes = typedLesson.pages.filter(page =>
  page.contentBox.boxType === 'quiz' || page.contentBox.boxType === 'graph-quiz');

describe('Lesson 6 content contract', () => {
  it('has the expected lesson identity and complete 14-screen flow', () => {
    expect(lesson.meta.lessonNumber).toBe(6);
    expect(lesson.pages).toHaveLength(14);
    expect(quizzes).toHaveLength(10);
    expect(lesson.pages[0].title).toBe('Show what you know');
    expect(lesson.pages[11].pageType).toBe('results');
    expect(lesson.pages[12].pageType).toBe('review');
    expect(lesson.pages[13].buttonLabel).toBe('Back to learning path');
  });

  it.each(lesson.pages.map((page, index) => ({ ...page, index })))('page $index has usable copy and an action', page => {
    expect(page.title.trim()).not.toBe('');
    expect(page.subtext.trim()).not.toBe('');
    expect(page.buttonLabel.trim()).not.toBe('');
    expect(['CONTINUE', 'MULT-CHOICE']).toContain(page.questionType);
    if (page.contentBox.boxType === 'text') {
      expect(page.contentBox.title?.trim()).not.toBe('');
      expect(page.contentBox.text?.trim()).not.toBe('');
    }
  });

  it.each(quizzes)('$title has unique choices, exactly one valid key and an explanation', page => {
    const box = page.contentBox;
    if (box.boxType !== 'quiz' && box.boxType !== 'graph-quiz') throw new Error('Expected a quiz');
    expect(page.questionType).toBe('MULT-CHOICE');
    expect(box.question.trim()).not.toBe('');
    expect(box.options.length).toBeGreaterThanOrEqual(2);
    expect(new Set(box.options.map(option => option.id)).size).toBe(box.options.length);
    expect(new Set(box.options.map(option => option.label)).size).toBe(box.options.length);
    expect(box.options.filter(option => option.id === box.correctAnswerId)).toHaveLength(1);
    box.options.forEach(option => expect(option.label.trim()).not.toBe(''));
    expect(box.explanation?.trim()).toBeTruthy();
  });

  it('uses independently checked answer keys, rather than accepting any JSON key', () => {
    const expected = ['4', 'A to B only', '8', 'A = 0; all others = \u221e',
      'B = 4; C = 2', 'C', '3', '8', 'A \u2192 C \u2192 B \u2192 D \u00b7 cost 8',
      'All edge weights are non-negative'];
    expect(quizzes.map(page => {
      const box = page.contentBox;
      if (box.boxType !== 'quiz' && box.boxType !== 'graph-quiz') throw new Error('Expected a quiz');
      return box.options.find(option => option.id === box.correctAnswerId)?.label;
    })).toEqual(expected);
  });

  it('keeps the same valid, undirected, read-only assessment graph on every graph screen', () => {
    const graphPages = typedLesson.pages.filter(page =>
      'state' in page.contentBox && page.contentBox.isDirected === false);
    expect(graphPages).toHaveLength(9);
    const first = graphPages[0].contentBox;
    if (!('state' in first)) throw new Error('Missing assessment graph');
    for (const page of graphPages) {
      const box = page.contentBox;
      if (!('state' in box)) throw new Error('Missing graph');
      expect(box.state).toEqual(first.state);
      expect(box.readOnly).toBe(true);
      expect(box.isDirected).toBe(false);
      const { nodes, edges } = box.state;
      const ids = nodes.map(node => node.id);
      expect(new Set(ids).size).toBe(nodes.length);
      expect(new Set(edges.map(edge => edge.id)).size).toBe(edges.length);
      for (const node of nodes) {
        expect(Number.isFinite(node.x) && Number.isFinite(node.y)).toBe(true);
        expect(node.x).toBeGreaterThan(0);
        expect(node.x).toBeLessThan(600);
        expect(node.y).toBeGreaterThan(0);
        expect(node.y).toBeLessThan(400);
      }
      for (const edge of edges) {
        expect(ids).toContain(edge.source);
        expect(ids).toContain(edge.target);
        expect(edge.source).not.toBe(edge.target);
        expect(Number.isFinite(Number(edge.label))).toBe(true);
        expect(Number(edge.label)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it.each(['Find the vertices', 'Follow the arrow', 'Compute a path cost',
    'Set initial distances', 'Explore the source', 'Select the next vertex',
    'Relax from C', 'Relax from B', 'Find the final route'])(
    '%s supplies its own graph instead of relying on a previous screen', title => {
      const box = typedLesson.pages.find(page => page.title === title)!.contentBox;
      expect(box.boxType).toBe('graph-quiz');
      expect('state' in box && box.state.nodes.length).toBeGreaterThan(0);
    });

  it('illustrates the directed-edge question with exactly A to B', () => {
    const box = typedLesson.pages.find(page => page.title === 'Follow the arrow')!.contentBox;
    if (box.boxType !== 'graph-quiz') throw new Error('Missing directed graph');
    expect(box.isDirected).toBe(true);
    expect(box.readOnly).toBe(true);
    expect(box.state.nodes.map(node => node.id)).toEqual(['A', 'B']);
    expect(box.state.edges).toEqual([{ id: 'AB', source: 'A', target: 'B' }]);
  });

  it('independently enumerates simple paths to verify the shortest route and distractor costs', () => {
    const box = typedLesson.pages[0].contentBox;
    if (!('state' in box)) throw new Error('Missing graph');
    const routes: { path: string; cost: number }[] = [];
    function visit(path: string[], cost: number) {
      const node = path[path.length - 1];
      if (node === 'D') { routes.push({ path: path.join(''), cost }); return; }
      for (const edge of 'state' in box ? box.state.edges : []) {
        const next = edge.source === node ? edge.target : edge.target === node ? edge.source : null;
        if (next && !path.includes(next)) visit([...path, next], cost + Number(edge.label));
      }
    }
    visit(['A'], 0);
    expect(routes.sort((a, b) => a.cost - b.cost)[0]).toEqual({ path: 'ACBD', cost: 8 });
    expect(routes).toContainEqual({ path: 'ABD', cost: 9 });
    expect(routes).toContainEqual({ path: 'ACD', cost: 10 });
  });
});
