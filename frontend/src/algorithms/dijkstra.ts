/** Pure Dijkstra implementation used by the Lesson 4 worked example. */
export type VertexId = "A" | "B" | "C" | "D";

export interface WeightedEdge {
  id: string;
  source: VertexId;
  target: VertexId;
  weight: number;
}

export const LESSON4_VERTICES: readonly VertexId[] = ["A", "B", "C", "D"];
export const LESSON4_EDGES: readonly WeightedEdge[] = [
  { id: "AB", source: "A", target: "B", weight: 4 },
  { id: "AC", source: "A", target: "C", weight: 2 },
  { id: "BC", source: "B", target: "C", weight: 1 },
  { id: "BD", source: "B", target: "D", weight: 3 },
  { id: "CD", source: "C", target: "D", weight: 6 },
];

export interface DijkstraStep {
  current: VertexId | null;
  distances: Record<VertexId, number>;
  predecessors: Record<VertexId, VertexId | null>;
  settled: VertexId[];
  updated: VertexId[];
}

/**
 * Each returned frame is the graph state *after* selecting a vertex and relaxing
 * its neighbours. Frame 0 is the initial state, before any vertex is settled.
 * Edges are undirected and all weights must be finite and non-negative.
 */
export function computeDijkstraTrace(
  vertices: readonly VertexId[] = LESSON4_VERTICES,
  edges: readonly WeightedEdge[] = LESSON4_EDGES,
  source: VertexId = "A",
): DijkstraStep[] {
  if (new Set(vertices).size !== vertices.length || !vertices.includes(source)) {
    throw new Error("The source must be present and all vertices unique.");
  }
  const adjacency = new Map<VertexId, { target: VertexId; weight: number }[]>(
    vertices.map((id) => [id, []]),
  );
  for (const edge of edges) {
    if (!adjacency.has(edge.source) || !adjacency.has(edge.target) || edge.source === edge.target) {
      throw new Error("An edge must connect two different existing vertices.");
    }
    if (!Number.isFinite(edge.weight) || edge.weight < 0) {
      throw new Error("Dijkstra requires finite, non-negative weights.");
    }
    adjacency.get(edge.source)!.push({ target: edge.target, weight: edge.weight });
    adjacency.get(edge.target)!.push({ target: edge.source, weight: edge.weight });
  }

  const distances = Object.fromEntries(vertices.map((id) => [id, Infinity])) as Record<VertexId, number>;
  const predecessors = Object.fromEntries(vertices.map((id) => [id, null])) as Record<VertexId, VertexId | null>;
  const settled = new Set<VertexId>();
  distances[source] = 0;

  function frame(current: VertexId | null, updated: VertexId[]): DijkstraStep {
    return {
      current,
      distances: { ...distances },
      predecessors: { ...predecessors },
      settled: [...settled],
      updated: [...updated],
    };
  }

  const steps = [frame(null, [])];
  while (true) {
    // Resolve equal distances alphabetically to keep the teaching trace deterministic.
    const next = [...vertices]
      .filter((v) => !settled.has(v) && Number.isFinite(distances[v]))
      .sort((a, b) => distances[a] - distances[b] || a.localeCompare(b))[0];
    if (!next) break;

    settled.add(next);
    const updated: VertexId[] = [];
    for (const neighbour of adjacency.get(next)!) {
      if (settled.has(neighbour.target)) continue;
      const candidate = distances[next] + neighbour.weight;
      if (candidate < distances[neighbour.target]) {
        distances[neighbour.target] = candidate;
        predecessors[neighbour.target] = next;
        updated.push(neighbour.target);
      }
    }
    steps.push(frame(next, updated));
  }
  return steps;
}

/** Follow predecessors backwards; null represents an unreachable destination. */
export function shortestRoute(
  snapshot: DijkstraStep,
  destination: VertexId = "D",
): VertexId[] | null {
  if (!Number.isFinite(snapshot.distances[destination])) return null;
  const reversed: VertexId[] = [];
  const seen = new Set<VertexId>();
  let cursor: VertexId | null = destination;
  while (cursor !== null) {
    if (seen.has(cursor)) throw new Error("Invalid predecessor cycle.");
    seen.add(cursor);
    reversed.push(cursor);
    cursor = snapshot.predecessors[cursor];
  }
  return reversed.reverse();
}
