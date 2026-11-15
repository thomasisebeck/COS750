import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import source from '../lessons/lesson-6.json';
import { assessmentBank } from '../lessons/questionBanks';
import type { LessonData } from '../types/lesson';

const generated = assessmentBank(source as LessonData, 1);
const questions = generated.pages.filter(page =>
  page.contentBox?.boxType === 'quiz' || page.contentBox?.boxType === 'graph-quiz');
const correctLabel = (index: number) => {
  const box = questions[index].contentBox;
  if (!box || (box.boxType !== 'quiz' && box.boxType !== 'graph-quiz')) throw new Error('Missing assessment question');
  return box.options.find(option => option.id === box.correctAnswerId)!.label;
};
const wrongLabel = (index: number) => {
  const box = questions[index].contentBox;
  if (!box || (box.boxType !== 'quiz' && box.boxType !== 'graph-quiz')) throw new Error('Missing assessment question');
  return box.options.find(option => option.id !== box.correctAnswerId)!.label;
};

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(Math, 'random').mockReturnValue(0);
});
afterEach(() => vi.restoreAllMocks());

async function begin() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', {name: /Prove Your Skills/}));
  await user.click(screen.getByRole('button', {name: 'Begin lesson 06'}));
  await user.click(screen.getByRole('button', {name: 'Start assessment'}));
  return user;
}
async function answerQuestions(user: ReturnType<typeof userEvent.setup>, correctCount: number) {
  for (let index = 0; index < questions.length; index++) {
    expect(screen.getByRole('heading', {name: questions[index].title, level: 1})).toBeVisible();
    const check = screen.getByRole('button', {name: 'Check answer'});
    expect(check).toBeDisabled();
    await user.click(screen.getByRole('button', {name: index < correctCount ? correctLabel(index) : wrongLabel(index)}));
    await user.click(check);
    expect(within(screen.getByRole('status')).getByText(index < correctCount ? 'Correct!' : 'Keep learning')).toBeVisible();
    await user.click(screen.getByRole('button', {name: 'Continue'}));
  }
  expect(screen.getByRole('heading', {name: 'Your learning profile'})).toBeVisible();
}

describe('Lesson 6 — 14 graded questions and achievements', () => {
  it('starts with an introduction and no score or premature achievement', async () => {
    const user = await begin();
    expect(questions).toHaveLength(14);
    expect(screen.getByRole('button', {name: 'Check answer'})).toBeDisabled();
    expect(screen.getByText('2/18')).toBeVisible();
    expect(window.localStorage.getItem('pf-assessment-best-v2')).toBeNull();
    await user.click(screen.getByRole('button', {name: 'Back to learning path'}));
    expect(screen.getByLabelText('Total experience: 0 XP')).toBeVisible();
    expect(screen.queryByText('Achievement unlocked!')).not.toBeInTheDocument();
  });

  it.each([0, 7, 11, 14])('correctly displays a score of %i/14', async count => {
    const user = await begin();
    await answerQuestions(user, count);
    expect(screen.getByText(`${count} / 14`, {exact: true})).toBeVisible();
    expect(screen.getByText(count >= 12 ? 'Excellent work!' : 'Every answer is a step forward.')).toBeVisible();
    expect(window.localStorage.getItem('pf-assessment-best-v2')).toBe(String(count));
  });

  it('awards Lesson 6 immediately at results even when all earlier lessons are skipped', async () => {
    const user = await begin();
    await answerQuestions(user, 9);
    expect(screen.getByText('Achievement unlocked! · +100 XP')).toBeVisible();
    expect(JSON.parse(window.localStorage.getItem('pf-completed') ?? '[]')).toEqual([6]);
    await user.click(screen.getByRole('button', {name: 'Back to learning path'}));
    expect(screen.getByLabelText('Total experience: 100 XP')).toBeVisible();
    expect(screen.getByText('Achievement unlocked!')).toBeVisible();
    expect(screen.getByText('Unlocked · 100 XP')).toBeVisible();
  });

  it('a retry can replace the best score; replay cannot duplicate XP', async () => {
    const user = await begin();
    await answerQuestions(user, 8);
    await user.click(screen.getByRole('button', {name: 'Try assessment again'}));
    await user.click(screen.getByRole('button', {name: 'Start assessment'}));
    await answerQuestions(user, 14);
    expect(screen.getByText('You reached first place!')).toBeVisible();
    expect(window.localStorage.getItem('pf-assessment-best-v2')).toBe('14');
    await user.click(screen.getByRole('button', {name: 'Back to learning path'}));
    expect(screen.getByLabelText('Total experience: 100 XP')).toBeVisible();
    expect(JSON.parse(window.localStorage.getItem('pf-completed') ?? '[]')).toEqual([6]);
  });

  it('does not mark the assessment complete from only visiting the first question', async () => {
    const user = await begin();
    await user.click(screen.getByRole('button', {name: correctLabel(0)}));
    await user.click(screen.getByRole('button', {name: 'Check answer'}));
    await user.click(screen.getByRole('button', {name: 'Back to learning path'}));
    expect(screen.getByLabelText('Total experience: 0 XP')).toBeVisible();
  });

  it('keeps previously saved lesson achievements and deduplicates invalid completed IDs', () => {
    window.localStorage.setItem('pf-completed','[1,1,4,7,-1]');
    render(<App />);
    expect(screen.getByLabelText('Total experience: 200 XP')).toBeVisible();
  });

  it('restores the historical Lesson 6 achievement after an older assessment result', () => {
    window.localStorage.setItem('pf-assessment-best','9');
    render(<App />);
    expect(screen.getByLabelText('Total experience: 100 XP')).toBeVisible();
    // The prior 9/10 is kept in storage, not presented as if it were graded out of 14.
    expect(window.localStorage.getItem('pf-assessment-best-v2')).toBeNull();
  });
});
