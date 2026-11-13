import type { GraphQuizContentBox, GraphState, QuizOption } from "../types/lesson.ts";

/** Shared route arithmetic for both the displayed quiz and generated retries. */
export function pathCost(graph: GraphState, path: string[]): number {
  if (path.length < 2) throw new Error("A path needs at least two vertices.");
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    const edge = graph.edges.find((candidate) =>
      (candidate.source === from && candidate.target === to) ||
      (candidate.source === to && candidate.target === from)
    );
    if (!edge || edge.label === undefined) {
      throw new Error(`Missing weighted edge: ${from}–${to}`);
    }
    const weight = Number(edge.label);
    if (!Number.isFinite(weight) || weight < 0) {
      throw new Error(`Invalid weight for edge ${edge.id}`);
    }
    total += weight;
  }
  return total;
}

const clampRandom = (random: () => number) => {
  const value = random();
  return Number.isFinite(value) ? Math.max(0, Math.min(0.999999, value)) : 0.5;
};

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(clampRandom(random) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pathExpression(graph: GraphState, path: string[]): string {
  return path.slice(1).map((id, i) => {
    const from = path[i];
    const edge = graph.edges.find((e) =>
      (e.source === from && e.target === id) || (e.target === from && e.source === id)
    );
    return String(edge?.label ?? "?");
  }).join(" + ");
}

/** Used for answer-choice highlighting on the existing LiveGraph. */
export function highlightedRoute(graph: GraphState, path: string[]): GraphState {
  const edges = path.slice(1).map((nodeId, index) => {
    const prev = path[index];
    return graph.edges.find((edge) =>
      (edge.source === prev && edge.target === nodeId) ||
      (edge.source === nodeId && edge.target === prev)
    )?.id;
  }).filter((id): id is string => id !== undefined);
  return { ...graph, highlightedNodes: [...path], highlightedEdges: edges };
}

export function quizExplanation(quiz: GraphQuizContentBox): string {
  const config = quiz.retryGenerator;
  if (!config) return "Check each edge weight along the route and add them together.";
  if (config.kind === "compare-routes") {
    const [first, second] = config.routes;
    const a = pathCost(quiz.state, first.path);
    const b = pathCost(quiz.state, second.path);
    const winner = a === b ? "The routes cost the same." : `${(a < b ? first : second).path.join(" → ")} is cheaper.`;
    return `${first.path.join(" → ")}: ${pathExpression(quiz.state, first.path)} = ${a}.\n${second.path.join(" → ")}: ${pathExpression(quiz.state, second.path)} = ${b}.\n${winner}`;
  }
  return `${config.path.join(" → ")}: ${pathExpression(quiz.state, config.path)} = ${pathCost(quiz.state, config.path)}. Add edge weights, not the number of edges.`;
}

/**
 * Generates a new weighted graph and its answer choices from the lesson JSON.
 * Each retry differs from the previous graph, including after many mistakes.
 */
export function generateRetryQuestion(
  template: GraphQuizContentBox,
  previous: GraphQuizContentBox,
  attempt: number,
  random: () => number = Math.random,
): GraphQuizContentBox {
  const config = template.retryGenerator;
  if (!config) throw new Error("This quiz has no retry generator configured.");
  const { min, max } = config.weightRange;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max <= min) {
    throw new Error("Retry weight range must contain at least two non-negative integers.");
  }

  const activeEdgeIds = config.edgeSets?.length
    ? new Set(config.edgeSets[attempt % config.edgeSets.length])
    : null;
  const baseEdges = template.state.edges.filter((edge) => !activeEdgeIds || activeEdgeIds.has(edge.id));
  const oldSignature = previous.state.edges.map((edge) => `${edge.id}:${edge.label}`).join("|");
  let updated = baseEdges.map((edge) => ({ ...edge }));
  let found = false;
  // Try for a genuinely different graph with a useful comparison.
  for (let tries = 0; tries < 80; tries++) {
    updated = baseEdges.map((edge) => ({
      ...edge,
      label: String(min + Math.floor(clampRandom(random) * (max - min + 1))),
    }));
    const candidate = { ...template.state, edges: updated };
    const differs = updated.map((edge) => `${edge.id}:${edge.label}`).join("|") !== oldSignature;
    const comparisonIsValid = config.kind !== "compare-routes" ||
      Math.abs(pathCost(candidate, config.routes[0].path) - pathCost(candidate, config.routes[1].path)) >= (config.minCostDifference ?? 1);
    if (differs && comparisonIsValid) { found = true; break; }
  }
  // Handles seeded/constant RNGs (and guarantees the next graph is not identical).
  if (!found) {
    const old = Number(previous.state.edges.find((edge) => edge.id === baseEdges[0].id)?.label ?? baseEdges[0].label);
    const replacement = old >= min && old <= max ? (old === max ? min : old + 1) : min;
    updated = baseEdges.map((edge, i) => ({
      ...edge,
      label: i === 0 ? String(replacement) : (previous.state.edges.find((oldEdge) => oldEdge.id === edge.id)?.label ?? edge.label),
    }));
    if (config.kind === "compare-routes") {
      // If that perturbation created a tie, change another route weight until there is a clear winner.
      const candidate = { ...template.state, edges: updated };
      if (pathCost(candidate, config.routes[0].path) === pathCost(candidate, config.routes[1].path)) {
        const differenceEdge = updated.find((edge) =>
          config.routes[0].path.some((node, i, path) => i > 0 &&
            ((edge.source === path[i - 1] && edge.target === node) ||
             (edge.target === path[i - 1] && edge.source === node))) &&
          !config.routes[1].path.some((node, i, path) => i > 0 &&
            ((edge.source === path[i - 1] && edge.target === node) ||
             (edge.target === path[i - 1] && edge.source === node)))
        );
        if (differenceEdge) {
          const value = Number(differenceEdge.label);
          differenceEdge.label = String(value === max ? min : value + 1);
        }
      }
    }
  }

  const state: GraphState = {
    ...template.state,
    nodes: template.state.nodes.map((node) => ({ ...node })),
    edges: updated,
    highlightedNodes: [],
    highlightedEdges: [],
  };
  let options: QuizOption[];
  let correctAnswerId: string;
  let question: string;
  if (config.kind === "compare-routes") {
    const [first, second] = config.routes;
    const a = pathCost(state, first.path);
    const b = pathCost(state, second.path);
    options = [
      { id: first.optionId, label: first.path.join(" → ") },
      { id: second.optionId, label: second.path.join(" → ") },
      { id: config.tieOptionId, label: "Both cost the same" },
    ];
    correctAnswerId = a < b ? first.optionId : b < a ? second.optionId : config.tieOptionId;
    question = template.question;
  } else {
    const total = pathCost(state, config.path);
    const distractors = (config.distractorOffsets ?? [-2, -1, 1, 2])
      .map((delta) => total + delta)
      .filter((value) => value >= 0 && value !== total);
    const unique = [...new Set(distractors)];
    if (unique.length < 2) throw new Error("Path cost retries need at least two valid distractors.");
    const wrong = shuffle(unique, random).slice(0, 2);
    options = [total, ...wrong].map((value) => ({ id: `cost-${value}`, label: String(value) }));
    correctAnswerId = `cost-${total}`;
    question = `What is the total cost of ${config.path.join(" → ")}?`;
  }
  // Rotates options with repeated attempts while avoiding fixed correct-answer positions.
  options = shuffle(options, random);
  if (attempt % 2 === 0) options.reverse();
  return { ...template, state, question, options, correctAnswerId };
}
