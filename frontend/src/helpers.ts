import type { GraphEdge } from "./components/LiveGraph";

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
 * Plays an audio note based on the given count (between 1 and 18).
 */
export const playNoteSound = (count: number): void => {
  if (count >= 1 && count <= 18) {
    const audio = new Audio(`/notes/${count}.mp3`);
    audio.currentTime = 0;
    audio.play().catch((err) => console.error("Audio playback error:", err));
  }
};
