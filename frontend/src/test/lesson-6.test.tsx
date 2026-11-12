import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';
import lesson from '../lessons/lesson-6.json';

const questions = lesson.pages.filter(page => page.questionType === 'MULT-CHOICE');
// Independent expected answers; do not derive expectations from correctAnswerId.
const correctLabels = ['4', 'A to B only', '8', 'A = 0; all others = \u221e',
  'B = 4; C = 2', 'C', '3', '8', 'A \u2192 C \u2192 B \u2192 D \u00b7 cost 8',
  'All edge weights are non-negative'];

async function openLesson() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /Prove Your Skills/ }));
  await user.click(screen.getByRole('button', { name: 'Begin lesson 06' }));
  return user;
}

async function startAssessment() {
  const user = await openLesson();
  await user.click(screen.getByRole('button', { name: 'Start assessment' }));
  return user;
}

async function finishAssessment(correctCount: number) {
  const user = await startAssessment();
  for (const [index, page] of questions.entries()) {
    expect(screen.getByRole('heading', { level: 1, name: page.title })).toBeVisible();
    const options = page.contentBox.options!;
    const label = index < correctCount ? correctLabels[index] : options.find(option => option.label !== correctLabels[index])!.label;
    await user.click(screen.getByRole('button', { name: label }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    const feedback = within(screen.getByRole('status'));
    expect(feedback.getByText(index < correctCount ? 'Correct!' : 'Keep learning')).toBeVisible();
    expect(feedback.getByText(page.contentBox.explanation!)).toBeVisible();
    for (const option of options) expect(screen.getByRole('button', { name: option.label })).toBeDisabled();
    expect(screen.getByText(new RegExp(`${index + 2}/14`))).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
  }
  return user;
}

describe('Lesson 6 assessment interaction', () => {
  it('opens from the learning path with an introduction and a guarded back button', async () => {
    await openLesson();
    expect(screen.getByRole('heading', { level: 1, name: 'Show what you know' })).toBeVisible();
    expect(screen.getByText('LESSON 6')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByText(/Answer ten questions/)).toBeVisible();
    expect(screen.getByText(/1\/14/)).toBeVisible();
  });

  it('requires a selection, supports changing it before submission, and exposes pressed state', async () => {
    const user = await startAssessment();
    const check = screen.getByRole('button', { name: 'Check answer' });
    expect(check).toBeDisabled();
    await user.click(check);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '3' }));
    expect(check).toBeEnabled();
    await user.click(screen.getByRole('button', { name: '4' }));
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '4' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(check);
    expect(within(screen.getByRole('status')).getByText('Correct!')).toBeVisible();
  });

  it.each([{ label: '4', feedback: 'Correct!' }, { label: '3', feedback: 'Keep learning' }])(
    'shows $feedback and an explanation for answer $label, then locks all choices', async ({ label, feedback }) => {
      const user = await startAssessment();
      await user.click(screen.getByRole('button', { name: label }));
      await user.click(screen.getByRole('button', { name: 'Check answer' }));
      const status = within(screen.getByRole('status'));
      expect(status.getByText(feedback)).toBeVisible();
      expect(status.getByText('The four vertices are A, B, C and D.')).toBeVisible();
      for (const option of ['3', '4', '5']) expect(screen.getByRole('button', { name: option })).toBeDisabled();
      await user.click(screen.getByRole('button', { name: label === '4' ? '3' : '4' }));
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByRole('button', { name: 'Check answer' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Continue' }));
      expect(screen.getByRole('heading', { level: 1, name: 'Follow the arrow' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

  it('restores checked answers and feedback on back navigation without allowing a second attempt', async () => {
    const user = await startAssessment();
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '4' })).toBeDisabled();
    expect(within(screen.getByRole('status')).getByText('Keep learning')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    await user.click(screen.getByRole('button', { name: 'Start assessment' }));
    expect(screen.getByRole('button', { name: '3' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('supports keyboard selection and submission', async () => {
    const user = await startAssessment();
    const correct = screen.getByRole('button', { name: '4' });
    correct.focus();
    await user.keyboard(' ');
    expect(correct).toHaveAttribute('aria-pressed', 'true');
    screen.getByRole('button', { name: 'Check answer' }).focus();
    await user.keyboard('{Enter}');
    expect(within(screen.getByRole('status')).getByText('Correct!')).toBeVisible();
  });

  it('renders the real graph read-only, with weights, no directed arrows and no reset', async () => {
    const user = await startAssessment();
    expect(screen.getByText('Assessment graph')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Reset/ })).not.toBeInTheDocument();
    const graph = screen.getByText('Assessment graph').closest('div.relative')!;
    const svg = graph.querySelector('svg[viewBox="0 0 600 400"]')!;
    expect(svg).toHaveAttribute('viewBox', '0 0 600 400');
    expect(svg.querySelectorAll('line[marker-end]')).toHaveLength(0);
    expect(svg.querySelectorAll('circle')).toHaveLength(4);
    expect([...svg.querySelectorAll('text')].map(node => node.textContent)).toEqual(expect.arrayContaining(['A', 'B', 'C', 'D', '4', '2', '1', '5', '8']));
    const original = svg.innerHTML;
    await user.click(within(graph as HTMLElement).getByText('B', { exact: true }));
    fireEvent.mouseDown(svg.querySelector('circle')!);
    fireEvent.mouseMove(svg, { clientX: 150, clientY: 100 });
    fireEvent.mouseUp(svg);
    await user.click(svg.querySelector('line')!);
    expect(svg.innerHTML).toBe(original);
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.queryByText('Assessment graph')).not.toBeInTheDocument();
  });
});

describe('Lesson 6 results and lifecycle', () => {
  it.each([0, 7, 8, 10])('scores %i correct first attempts accurately, including the encouragement threshold', async count => {
    await finishAssessment(count);
    expect(screen.getByRole('heading', { level: 1, name: 'Your learning profile' })).toBeVisible();
    expect(screen.getByText(`${count} / 10`, { exact: true })).toBeVisible();
    expect(screen.getByText(`${count} correct answers out of 10. ${10 - count} topics to revisit.`)).toBeVisible();
    expect(screen.getByText(count >= 8 ? 'Excellent work!' : 'Every answer is a step forward.')).toBeVisible();
    for (const question of questions) {
      expect(screen.getByText(question.title, { exact: true })).toBeVisible();
      expect(screen.getByText(question.contentBox.explanation!, { exact: true })).toBeVisible();
    }
  });

  it('recommends the first missed skill and completes the remaining screens back to the menu', async () => {
    const user = await finishAssessment(7);
    await user.click(screen.getByRole('button', { name: 'See next steps' }));
    expect(screen.getByText('Practise: Relax from B')).toBeVisible();
    expect(screen.getByText(questions[7].contentBox.explanation!)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(/14\/14/)).toBeVisible();
    await user.click(screen.getByText('Back to learning path', { selector: 'span' }).closest('button')!);
    expect(screen.getByRole('heading', { name: 'Graphs & shortest paths' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Begin lesson 06' })).toBeVisible();
  });

  it('offers a harder challenge for a perfect score and keeps the score stable when revisiting results', async () => {
    const user = await finishAssessment(10);
    await user.click(screen.getByRole('button', { name: 'See next steps' }));
    expect(screen.getByText('Ready for a bigger challenge')).toBeVisible();
    expect(screen.queryByText(/^Practise:/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByText('10 / 10', { exact: true })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByRole('button', { name: correctLabels[9] })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('10 / 10', { exact: true })).toBeVisible();
  });

  it('retry clears all previous answers, feedback and score', async () => {
    const user = await finishAssessment(10);
    await user.click(screen.getByRole('button', { name: 'Try assessment again' }));
    expect(screen.getByRole('heading', { name: 'Show what you know' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Start assessment' }));
    for (const [index, question] of questions.entries()) {
      expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      const wrong = question.contentBox.options!.find(option => option.label !== correctLabels[index])!;
      expect(screen.getByRole('button', { name: correctLabels[index] })).toHaveAttribute('aria-pressed', 'false');
      await user.click(screen.getByRole('button', { name: wrong.label }));
      await user.click(screen.getByRole('button', { name: 'Check answer' }));
      await user.click(screen.getByRole('button', { name: 'Continue' }));
    }
    expect(screen.getByText('0 / 10', { exact: true })).toBeVisible();
  });

  it('can exit from results, open another lesson, and start Lesson 6 fresh without stale page state', async () => {
    const user = await finishAssessment(7);
    await user.click(screen.getByRole('button', { name: 'Back to learning path' }));
    await user.click(screen.getByRole('button', { name: /Meet the Graph/ }));
    await user.click(screen.getByRole('button', { name: 'Begin lesson 01' }));
    expect(screen.getByRole('heading', { name: 'Meet the Graph' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Back to learning path' }));
    await user.click(screen.getByRole('button', { name: /Prove Your Skills/ }));
    await user.click(screen.getByRole('button', { name: 'Begin lesson 06' }));
    await user.click(screen.getByRole('button', { name: 'Start assessment' }));
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
