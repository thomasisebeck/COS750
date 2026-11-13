import {
  computeDijkstraTrace,
  LESSON4_EDGES,
  LESSON4_VERTICES,
  type DijkstraStep,
  type VertexId,
  type WeightedEdge,
} from "../algorithms/dijkstra.ts";

/** All question and graph variations are configured by lesson-4.json. */
export interface NextVertexGeneratorConfig {
  kind: "next-unsettled";
  source: VertexId;
  snapshotIndex: number;
  weightRange: { min: number; max: number };
  extraEdges?: WeightedEdge[];
  edgeSets: string[][];
}

export interface DijkstraQuestion {
  edges: WeightedEdge[];
  trace: DijkstraStep[];
  frame: DijkstraStep;
  options: { id: VertexId; label: string }[];
  correctAnswerId: VertexId;
  question: string;
  explanation: string;
  signature: string;
}

function signature(edges: readonly WeightedEdge[]): string {
  return edges.map(({ id, weight }) => `${id}:${weight}`).join("|");
}

function getNextVertex(frame: DijkstraStep): VertexId | null {
  return [...LESSON4_VERTICES]
    .filter((id) => !frame.settled.includes(id) && Number.isFinite(frame.distances[id]))
    .sort((a, b) => frame.distances[a] - frame.distances[b] || a.localeCompare(b))[0] ?? null;
}

export function describeDistances(frame: DijkstraStep): string {
  return LESSON4_VERTICES.filter((vertex) => !frame.settled.includes(vertex))
    .map((vertex) => `${vertex} = ${Number.isFinite(frame.distances[vertex]) ? frame.distances[vertex] : "∞"}`)
    .join(", ");
}

export function makeNextVertexQuestion(
  edges: readonly WeightedEdge[],
  config: NextVertexGeneratorConfig,
): DijkstraQuestion {
  if (config.kind !== "next-unsettled" || config.snapshotIndex < 1 || !Number.isInteger(config.snapshotIndex)) {
    throw new Error("The quiz must use a valid post-relaxation snapshot.");
  }
  const trace = computeDijkstraTrace(LESSON4_VERTICES, edges, config.source);
  const frame = trace[config.snapshotIndex];
  if (!frame) throw new Error("The configured Dijkstra snapshot does not exist.");
  const answer = getNextVertex(frame);
  const unsettled = LESSON4_VERTICES.filter((v) => !frame.settled.includes(v));
  const finite = unsettled.filter((v) => Number.isFinite(frame.distances[v]));
  if (!answer || finite.length < 2 || finite.some((v) => v !== answer && frame.distances[v] === frame.distances[answer])) {
    throw new Error("The quiz needs two reachable choices and a unique lowest tentative distance.");
  }
  return {
    edges: edges.map((edge) => ({ ...edge })),
    trace,
    frame,
    options: unsettled.map((v) => ({ id: v, label: `Vertex ${v}` })),
    correctAnswerId: answer,
    question: "Which unsettled vertex should Dijkstra select next?",
    explanation: `After settling ${frame.current}, the unsettled distances are ${describeDistances(frame)}. ` +
      `${answer} is next because ${frame.distances[answer]} is the smallest finite tentative distance.`,
    signature: signature(edges),
  };
}

const randomFraction = (random: () => number) => {
  const r = random();
  return Number.isFinite(r) ? Math.min(0.999999999, Math.max(0, r)) : 0.5;
};

/**
 * Choose a new graph and recompute its Dijkstra trace, options, and answer.
 * Always returns a graph different from the previous question, even with a
 * constant seeded random function. Does not mutate the original lesson graph.
 */
export function generateNextVertexRetry(
  config: NextVertexGeneratorConfig,
  previous: DijkstraQuestion,
  attempt: number,
  random: () => number = Math.random,
): DijkstraQuestion {
  const { min, max } = config.weightRange;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max <= min) {
    throw new Error("The weight range must include at least two non-negative integers.");
  }
  if (!Number.isInteger(attempt) || attempt < 1 || !config.edgeSets?.length) {
    throw new Error("Retry attempts and edge-set definitions must be valid.");
  }
  const catalog = new Map([...LESSON4_EDGES, ...(config.extraEdges ?? [])].map((edge) => [edge.id, edge]));
  const edgeIds = config.edgeSets[attempt % config.edgeSets.length];
  if (!edgeIds?.length || new Set(edgeIds).size !== edgeIds.length) {
    throw new Error("Each retry needs a non-empty set of unique edges.");
  }
  const templates = edgeIds.map((id) => {
    const edge = catalog.get(id);
    if (!edge) throw new Error(`Unknown graph edge: ${id}`);
    return edge;
  });
  const span = max - min + 1;
  // The offset changes the graph on every retry, including for deterministic RNG.
  for (let trial = 0; trial < 200; trial++) {
    const edges = templates.map((edge, i) => ({
      ...edge,
      weight: min + (Math.floor(randomFraction(random) * span) + attempt * (i + 1) + trial * (i + 2)) % span,
    }));
    if (signature(edges) === previous.signature) continue;
    try {
      return makeNextVertexQuestion(edges, config);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("unique lowest")) throw error;
    }
  }
  // Error instead of showing an ambiguous or incorrectly marked question.
  throw new Error("Could not generate an unambiguous retry. Check lesson-4.json edge sets.");
}

/** The first question must reflect the same graph as the worked example. */
export function makeInitialLesson4Question(config: NextVertexGeneratorConfig): DijkstraQuestion {
  return makeNextVertexQuestion(LESSON4_EDGES, config);
}
