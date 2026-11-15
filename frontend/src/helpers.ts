import type { GraphEdge } from "./components/LiveGraph";

function soundLevel():number {
  try {
    const value=Number(window.localStorage.getItem("pf-volume") ?? "100");
    return Math.max(0,Math.min(1,Number.isFinite(value) ? value/100 : 1));
  } catch { return 1; }
}

/**
 * Finds connecting edge IDs between consecutive nodes in a path sequence.
 */
export const getConnectingEdges = (
  path: string[],
  graphEdges: GraphEdge[],
): string[] => {
  const activeEdgeIds: string[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];

    const matchingEdge = graphEdges.find(
      (edge) =>
        (edge.source === u && edge.target === v) ||
        (edge.source === v && edge.target === u),
    );

    if (matchingEdge) {
      activeEdgeIds.push(matchingEdge.id);
    }
  }
  return activeEdgeIds;
};

/**
 * All graph interactions share the bright piano timbre introduced in Lesson 0.
 * Correct/incorrect answer cues deliberately remain separate.
 */
export const playNoteSound = (count: number): void => {
  playPianoNote(Math.max(0, count - 1));
};

let feedbackAudio: AudioContext | null = null;

/**
 * A short two-tone response to a checked answer, never to an unsubmitted choice.
 * Synthesised locally so it works offline, without downloading sound files.
 * The existing sound preference mutes both these cues and graph notes.
 */
export const playFeedbackSound = (correct: boolean): void => {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem("pf-sound") === "false") return;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    feedbackAudio ??= new AudioContextClass();
    const context = feedbackAudio;
    if (context.state === "suspended") void context.resume().catch(() => {});

    const start = context.currentTime + 0.012;
    const notes = correct
      ? [{ frequency: 523.25, at: 0, length: 0.13 }, { frequency: 783.99, at: 0.12, length: 0.23 }]
      : [{ frequency: 392, at: 0, length: 0.14 }, { frequency: 311.13, at: 0.14, length: 0.18 }];

    for (const note of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const noteStart = start + note.at;
      oscillator.type = correct ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(note.frequency, noteStart);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0001,(correct ? 0.18 : 0.12)*soundLevel()), noteStart + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.length);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + note.length + 0.015);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }
  } catch { /* No audio support or permission: visual and written feedback still work. */ }
};

/** Bright, short piano-style tones used for graph interactions in every lesson. */
export function playPianoNote(index: number): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem("pf-sound") === "false") return;
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    feedbackAudio ??= new AudioContextClass();
    const context = feedbackAudio;
    if (context.state === "suspended") void context.resume().catch(() => {});
    const base = [261.63,329.63,392,523.25][Math.abs(index)%4];
    const now=context.currentTime+.008;
    [1,2,3].forEach((overtone,i) => {
      const oscillator=context.createOscillator();
      const gain=context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(base*overtone,now);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0001,[.19,.055,.02][i]*soundLevel()),now+.009);
      gain.gain.exponentialRampToValueAtTime(.0001,now+.43);
      oscillator.connect(gain);gain.connect(context.destination);
      oscillator.start(now);oscillator.stop(now+.45);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    });
  } catch { /* Visual selection works even without audio support. */ }
}
