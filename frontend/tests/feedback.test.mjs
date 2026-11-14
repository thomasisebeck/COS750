import test from 'node:test';
import assert from 'node:assert/strict';
import { playFeedbackSound } from '../src/helpers.ts';

const notes = [];
class FakeAudioContext {
  state = 'running';
  currentTime = 1;
  destination = {};
  createOscillator() {
    const note = { frequency: 0, started: false, stopped: false };
    notes.push(note);
    return {
      type: '',
      frequency: { setValueAtTime(value) { note.frequency = value; } },
      connect() {}, disconnect() {},
      start() { note.started = true; },
      stop() { note.stopped = true; },
    };
  }
  createGain() {
    return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
  }
}
const preferences = new Map();
globalThis.window = {
  AudioContext: FakeAudioContext,
  localStorage: { getItem(key) { return preferences.get(key) ?? null; } },
};

test('feedback sound respects the existing accessibility mute preference', () => {
  notes.length = 0;
  preferences.set('pf-sound', 'false');
  playFeedbackSound(true);
  playFeedbackSound(false);
  assert.equal(notes.length, 0);
});

test('checked answers have different short audible cues', () => {
  preferences.set('pf-sound', 'true');
  playFeedbackSound(true);
  assert.deepEqual(notes.map(note => note.frequency), [523.25, 783.99]);
  assert.ok(notes.every(note => note.started && note.stopped));
  notes.length = 0;
  playFeedbackSound(false);
  assert.deepEqual(notes.map(note => note.frequency), [392, 311.13]);
  assert.ok(notes.every(note => note.started && note.stopped));
});

test('lessons 1–6 play sounds on answer submission, not option selection', async () => {
  const { readFile } = await import('node:fs/promises');
  for (const lesson of [1,2,3,4,5,6]) {
    const source = await readFile(new URL(`../src/components/Lesson${lesson}Experience.tsx`, import.meta.url), 'utf8');
    assert.match(source, /playFeedbackSound\(/, `Lesson ${lesson} missing feedback sound`);
  }
});
