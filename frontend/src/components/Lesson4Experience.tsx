import { useState } from "react";
import { ArrowRight, CircleCheck, Info, RotateCcw } from "lucide-react";
import { LessonHeader } from "./LessonHeader";
import { PageTitle } from "./PageTitle";
import { ProgressBar } from "./progressBar";
import { InfoCard } from "./infoCard";
import { LessonButton } from "./buttons";
import { OptionCard } from "./optionCard";
import { LiveGraph, type GraphNode, type GraphEdge } from "./LiveGraph";
import {
  computeDijkstraTrace,
  shortestRoute,
  LESSON4_VERTICES,
  LESSON4_EDGES,
  type VertexId,
  type WeightedEdge,
} from "../algorithms/dijkstra";
import {
  generateNextVertexRetry,
  makeInitialLesson4Question,
  type NextVertexGeneratorConfig,
} from "../lessons/lesson4Questions";
import lesson4Raw from "../lessons/lesson-4.json";
import { playNoteSound } from "../helpers";
import "./lesson4.css";

type PageKind = "intro" | "walkthrough" | "quiz" | "limit" | "complete";

interface Lesson4Page {
  type: PageKind;
  eyebrow: string;
  title: string;
  subtext: string;
  button: string;
  snapshotIndex?: number;
  activeVertex?: VertexId;
  highlightedEdges?: string[];
  showRoute?: boolean;
  cardTitle?: string;
  cardText?: string;
  tipTitle?: string;
  tipText?: string;
  note?: string;
  question?: string;
  retryGenerator?: NextVertexGeneratorConfig;
}

interface Lesson4Data {
  meta: { lessonNumber: number; title: string; topic: string };
  graph: { nodes: GraphNode[] };
  pages: Lesson4Page[];
}

const lesson4 = lesson4Raw as Lesson4Data;
const exampleTrace = computeDijkstraTrace(LESSON4_VERTICES, LESSON4_EDGES, "A");
const finalRoute = shortestRoute(exampleTrace[exampleTrace.length - 1], "D") ?? [];
const quizTemplate: NextVertexGeneratorConfig = (() => {
  const config = lesson4.pages.find((page) => page.type === "quiz")?.retryGenerator;
  if (!config) throw new Error("Lesson 4 needs a quiz retryGenerator in lesson-4.json.");
  return config;
})();

function distanceLabel(distance: number): string {
  return Number.isFinite(distance) ? String(distance) : "∞";
}

function routeEdgeIds(route: readonly VertexId[], edges: readonly WeightedEdge[]): string[] {
  return route.slice(1).flatMap((vertex, index) => {
    const previous = route[index];
    const edge = edges.find((candidate) =>
      (candidate.source === previous && candidate.target === vertex) ||
      (candidate.source === vertex && candidate.target === previous),
    );
    return edge ? [edge.id] : [];
  });
}

function graphEdges(edges: readonly WeightedEdge[]): GraphEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: String(edge.weight),
  }));
}

/** Reuses the existing lesson shell and LiveGraph, including for generated retries. */
export function Lesson4Experience({
  onExit,
  onComplete,
}: {
  onExit: () => void;
  onComplete?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<VertexId | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | "empty" | null>(null);
  const [retryNumber, setRetryNumber] = useState(0);
  const [quiz, setQuiz] = useState(() => makeInitialLesson4Question(quizTemplate));
  const [nodes, setNodes] = useState<GraphNode[]>(() => lesson4.graph.nodes.map((node) => ({ ...node })));
  
  const [extraHighlightedNodes, setExtraHighlightedNodes] = useState<string[]>([]);
  const [extraHighlightedEdges, setExtraHighlightedEdges] = useState<string[]>([]);

  const page = lesson4.pages[index];
  const isQuiz = page.type === "quiz";
  const isCheckedCorrect = feedback === "correct";
  const frameIndex = isQuiz ? quizTemplate.snapshotIndex : (page.snapshotIndex ?? 0);
  const activeTrace = isQuiz ? quiz.trace : exampleTrace;
  const frame = activeTrace[frameIndex] ?? activeTrace[0];
  const previousFrame = frameIndex > 0 ? activeTrace[frameIndex - 1] : null;
  const edges = isQuiz ? quiz.edges : LESSON4_EDGES;
  
  const baseHighlightedEdges = page.showRoute
    ? routeEdgeIds(finalRoute, LESSON4_EDGES)
    : isQuiz
      ? frame.current ? edges.filter((edge) => edge.source === frame.current || edge.target === frame.current).map((edge) => edge.id) : []
      : (page.highlightedEdges ?? []);
      
  const baseHighlightedNodes = page.showRoute
    ? finalRoute
    : [...new Set([...frame.settled, ...(page.activeVertex ? [page.activeVertex] : [])])];

  const highlightedNodes = [...new Set([...baseHighlightedNodes, ...extraHighlightedNodes])];
  const highlightedEdges = [...new Set([...baseHighlightedEdges, ...extraHighlightedEdges])];

  function navigate(nextIndex: number) {
    setIndex(nextIndex);
    setSelected(null);
    setFeedback(null);
    setExtraHighlightedNodes([]);
    setExtraHighlightedEdges([]);
  }

  function back() {
    if (index === 0) onExit();
    else navigate(index - 1);
  }

  function next() {
    if (isQuiz) {
      if (feedback === "incorrect") {
        const nextAttempt = retryNumber + 1;
        setQuiz((previous) => generateNextVertexRetry(quizTemplate, previous, nextAttempt));
        setRetryNumber(nextAttempt);
        setNodes(lesson4.graph.nodes.map((node) => ({ ...node })));
        setSelected(null);
        setFeedback(null);
        setExtraHighlightedNodes([]);
        setExtraHighlightedEdges([]);
        return;
      }
      if (!isCheckedCorrect) {
        if (!selected) {
          setFeedback("empty");
          return;
        }
        setFeedback(selected === quiz.correctAnswerId ? "correct" : "incorrect");
        return;
      }
    }
    if (index === lesson4.pages.length - 1) (onComplete ?? onExit)();
    else navigate(index + 1);
  }

  const actionLabel = isQuiz
    ? feedback === "incorrect" ? "Try a new graph" : isCheckedCorrect ? "Next step" : "Check answer"
    : page.button;

  const handleNodeClick = (nodeId: string) => {
    const isHighlighted = extraHighlightedNodes.includes(nodeId);
    const nextNodes = isHighlighted
      ? extraHighlightedNodes.filter((id) => id !== nodeId)
      : [...extraHighlightedNodes, nodeId];

    const nextNodesSet = new Set(nextNodes);
    const validEdges = extraHighlightedEdges.filter((edgeId) => {
      const edge = edges.find((e) => e.id === edgeId);
      if (!edge) return false;
      return nextNodesSet.has(edge.source) && nextNodesSet.has(edge.target);
    });

    playNoteSound(nextNodes.length + validEdges.length);
    setExtraHighlightedNodes(nextNodes);
    setExtraHighlightedEdges(validEdges);
  };

  const handleEdgeClick = (edgeId: string) => {
    const isHighlighted = extraHighlightedEdges.includes(edgeId);
    const nextEdges = isHighlighted
      ? extraHighlightedEdges.filter((id) => id !== edgeId)
      : [...extraHighlightedEdges, edgeId];

    playNoteSound(extraHighlightedNodes.length + nextEdges.length);
    setExtraHighlightedEdges(nextEdges);
  };

  return (
    <div className="l4-experience w-full min-h-screen bg-[#111116] text-slate-100 px-4 py-6 sm:px-6 flex flex-col gap-6">
      <div className="w-full max-w-[880px] mx-auto flex-1 flex flex-col gap-6">
        <LessonHeader lessonNumber={lesson4.meta.lessonNumber} onMenuClick={onExit} />
        <ProgressBar currentIndex={index} total={lesson4.pages.length} onBack={back} />

        <main className="flex-1 flex flex-col gap-5" key={index}>
          <PageTitle category={page.eyebrow} title={page.title} subtext={page.subtext} />

          {(page.type === "walkthrough" || isQuiz) && (
            <div className="l4-learning-grid">
              <div className="l4-live-graph">
                <LiveGraph
                  nodes={nodes}
                  edges={graphEdges(edges)}
                  highlightedNodeIds={highlightedNodes}
                  highlightedEdgeIds={highlightedEdges}
                  onNodeMove={(id, x, y) => {
                    setNodes((prev) => prev.map((node) => node.id === id ? { ...node, x, y } : node));
                  }}
                  onNodeClick={handleNodeClick}
                  onEdgeClick={handleEdgeClick}
                  onReset={() => {
                    setNodes(lesson4.graph.nodes.map((node) => ({ ...node })));
                    setExtraHighlightedNodes([]);
                    setExtraHighlightedEdges([]);
                  }}
                  width={400}
                  height={285}
                  isDirected={false}
                  mustSelectPath={false}
                  showCounts={false}
                />
                <p className="l4-graph-help">Drag vertices to explore the graph. Click nodes and edges to select paths.</p>
              </div>

              <section className="l4-tracker" aria-label="Dijkstra distance tracker">
                <header className="l4-tracker-header">
                  <div>
                    <span className="l4-overline">DISTANCE TRACKER</span>
                    <h2>Best known routes</h2>
                  </div>
                  <span className="l4-phase">{frame.current ? `Visited ${frame.current}` : "Before exploring"}</span>
                </header>
                <div className="l4-table-scroll">
                  <table className="l4-distance-table">
                    <caption className="l4-sr-only">Dijkstra tentative distances, predecessor vertices, and settled states</caption>
                    <thead><tr>
                      <th scope="col">Vertex</th>
                      <th scope="col">Distance</th>
                      <th scope="col">Via</th>
                      <th scope="col">Status</th>
                    </tr></thead>
                    <tbody>
                      {LESSON4_VERTICES.map((vertex) => {
                        const settled = frame.settled.includes(vertex);
                        const changed = frame.updated.includes(vertex) && previousFrame?.distances[vertex] !== frame.distances[vertex];
                        const current = frame.current === vertex;
                        return (
                          <tr key={vertex} className={changed ? "l4-row-updated" : current ? "l4-row-current" : ""}>
                            <th scope="row"><span className={`l4-vertex ${settled ? "l4-vertex-settled" : ""}`}>{vertex}</span></th>
                            <td>
                              {changed && previousFrame ? (
                                <span className="l4-change" aria-label={`Improved from ${distanceLabel(previousFrame.distances[vertex])} to ${distanceLabel(frame.distances[vertex])}`}>
                                  <span className="l4-before">{distanceLabel(previousFrame.distances[vertex])}</span>
                                  <ArrowRight size={12} aria-hidden="true" />
                                  <strong>{distanceLabel(frame.distances[vertex])}</strong>
                                </span>
                              ) : (
                                <strong className={Number.isFinite(frame.distances[vertex]) ? "l4-cost" : "l4-infinity"}>
                                  {distanceLabel(frame.distances[vertex])}
                                </strong>
                              )}
                            </td>
                            <td className="l4-via">{frame.predecessors[vertex] ?? "—"}</td>
                            <td><span className={`l4-status ${settled ? "l4-status-done" : changed ? "l4-status-new" : "l4-status-open"}`}>
                              {settled ? "Settled" : changed ? "Updated" : "Open"}
                            </span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="l4-tracker-legend">
                  <div><span className="l4-legend-dot l4-legend-dot-purple" />Tentative = best found so far</div>
                  <div><CircleCheck size={13} aria-hidden="true" />Settled = final distance</div>
                </div>
                {frame.updated.length > 0 && !isQuiz && (
                  <div className="l4-insight" aria-live="polite">
                    <span className="l4-insight-title"><RotateCcw size={13} aria-hidden="true" /> What changed?</span>
                    <p>{frame.updated.map((v) => `${v}: ${distanceLabel(previousFrame?.distances[v] ?? Infinity)} → ${distanceLabel(frame.distances[v])} via ${frame.predecessors[v]}`).join("  ·  ")}</p>
                  </div>
                )}
                {page.note && !isQuiz && <p className="l4-step-note">{page.note}</p>}
                {isQuiz && <p className="l4-step-note">Only unsettled vertices are eligible. Compare their distances in the table—∞ means not yet reachable.</p>}
              </section>
            </div>
          )}

          {isQuiz && (
            <section className="l4-quiz" aria-label="Question">
              {retryNumber > 0 && (
                <p className="l4-retry-label">
                  NEW PRACTICE GRAPH · ATTEMPT {retryNumber + 1} · THE WORKED EXAMPLE RESUMES AFTER THIS QUESTION
                </p>
              )}
              <h3 className="l4-question">{quiz.question}</h3>
              <div className="l4-options" role="group" aria-label={quiz.question}>
                {quiz.options.map((option) => (
                  <OptionCard
                    key={option.id}
                    label={option.label}
                    selected={selected === option.id}
                    onClick={() => {
                      if (isCheckedCorrect || feedback === "incorrect") return;
                      setSelected(option.id);
                      setFeedback(null);
                    }}
                  />
                ))}
              </div>
              <div aria-live="polite">
                {feedback && <InfoCard
                  heading={feedback === "correct" ? "That's right!" : feedback === "empty" ? "Choose a vertex" : "Let's work through it"}
                  body={feedback === "correct" ? `${quiz.explanation}${retryNumber ? " Next, we'll return to the original worked example." : ""}` : feedback === "empty"
                    ? "Pick one of the unsettled vertices, then check your answer."
                    : `${quiz.explanation} Try the same idea on a fresh graph.`}
                  variant={feedback === "correct" ? "green" : feedback === "empty" ? "default" : "red"}
                />}
              </div>
            </section>
          )}

          {(page.type === "intro" || page.type === "limit" || page.type === "complete") && (
            <div className="flex flex-col gap-4">
              {page.cardTitle && page.cardText && (
                <InfoCard
                  heading={page.cardTitle}
                  body={page.cardText}
                  variant={page.type === "complete" ? "green" : "default"}
                />
              )}
              {page.tipTitle && page.tipText && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    {page.tipTitle}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-mono">
                    {page.tipText}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="l4-footer">
          <LessonButton label={actionLabel} onClick={next} />
        </footer>
      </div>
    </div>
  );
}