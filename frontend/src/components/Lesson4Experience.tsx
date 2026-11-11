import { useMemo, useState } from "react";
import { Check, ChevronLeft } from "lucide-react";
import { Logo } from "./logo";
import { LessonButton } from "./buttons";
import { OptionCard } from "./optionCard";
import { DijkstraGraph } from "./DijkstraGraph";
import { computeDijkstraTrace, shortestRoute, LESSON4_VERTICES, LESSON4_EDGES, type VertexId } from "../algorithms/dijkstra";
import lesson4Raw from "../lessons/lesson-4.json";
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
  options?: { id: VertexId; label: string }[];
  correctAnswerId?: VertexId;
  correctFeedback?: string;
  incorrectFeedback?: string;
}

interface Lesson4Data {
  meta: { lessonNumber: number; title: string; topic: string };
  pages: Lesson4Page[];
}

const lesson4 = lesson4Raw as unknown as Lesson4Data;
const trace = computeDijkstraTrace(LESSON4_VERTICES, LESSON4_EDGES, "A");
const finalRoute = shortestRoute(trace[trace.length - 1], "D") ?? [];

function distanceLabel(distance: number): string {
  return Number.isFinite(distance) ? String(distance) : "∞";
}

/** Ten-screen Dijkstra lesson matching the supplied Lesson 4 storyboard. */
export function Lesson4Experience({ onExit }: { onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<VertexId | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | "empty" | null>(null);
  const page = lesson4.pages[index];
  const frame = trace[page.snapshotIndex ?? 0];
  const isQuiz = page.type === "quiz";
  const isCheckedCorrect = feedback === "correct";
  const routeEdges = useMemo(() => {
    if (!page.showRoute) return [];
    return finalRoute.slice(1).map((vertex, i) => {
      const previous = finalRoute[i];
      return LESSON4_EDGES.find((edge) =>
        (edge.source === previous && edge.target === vertex) ||
        (edge.target === previous && edge.source === vertex),
      )?.id;
    }).filter((id): id is string => Boolean(id));
  }, [page.showRoute]);

  function navigate(nextIndex: number) {
    setIndex(nextIndex);
    setSelected(null);
    setFeedback(null);
  }

  function back() {
    if (index === 0) onExit();
    else navigate(index - 1);
  }

  function next() {
    if (isQuiz && !isCheckedCorrect) {
      if (!selected) {
        setFeedback("empty");
        return;
      }
      setFeedback(selected === page.correctAnswerId ? "correct" : "incorrect");
      return;
    }
    if (index === lesson4.pages.length - 1) onExit();
    else navigate(index + 1);
  }

  return (
    <main className="l4-viewport">
      <article className="l4-screen" aria-label="Lesson 4: Find the Route">
        <header className="l4-header">
          <Logo />
          <span className="l4-lesson-label">LESSON 4</span>
        </header>
        <nav className="l4-progress-row" aria-label="Lesson 4 progress">
          <button type="button" className="l4-back" onClick={back}
            aria-label={index === 0 ? "Return to learning path" : "Previous page"}>
            <ChevronLeft size={18} strokeWidth={1.7} />
          </button>
          <div className="l4-progress-track" role="progressbar"
            aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={lesson4.pages.length}
            aria-label="Lesson progress">
            <span style={{ width: `${((index + 1) / lesson4.pages.length) * 100}%` }} />
          </div>
          <span className="l4-progress-text">4 · {index + 1}/{lesson4.pages.length}</span>
        </nav>

        <div className="l4-content" key={index}>
          <div className="l4-heading">
            <span className="l4-eyebrow">{page.eyebrow}</span>
            <h1>{page.title}</h1>
            <p>{page.subtext}</p>
          </div>

          {(page.type === "walkthrough" || page.type === "quiz") && (
            <>
              <DijkstraGraph
                activeVertex={page.activeVertex ?? null}
                settledVertices={frame.settled}
                highlightedEdges={page.showRoute ? routeEdges : (page.highlightedEdges ?? [])}
                routeVertices={page.showRoute ? finalRoute : []}
              />
              {page.type === "walkthrough" && (
                <>
                  <div className="l4-table-panel">
                    <table className="l4-distance-table">
                      <caption className="l4-sr-only">Tentative distances and predecessors after this step</caption>
                      <thead><tr>
                        <th scope="col">VERTEX</th><th scope="col">DIST</th>
                        <th scope="col">PREV</th><th scope="col">STATE</th>
                      </tr></thead>
                      <tbody>
                        {LESSON4_VERTICES.map((vertex) => (
                          <tr key={vertex}>
                            <th scope="row">{vertex}</th>
                            <td>{distanceLabel(frame.distances[vertex])}</td>
                            <td>{frame.predecessors[vertex] ?? "—"}</td>
                            <td className={frame.settled.includes(vertex) ? "l4-settled" : "l4-open"}>
                              {frame.settled.includes(vertex) ? "SETTLED" : "OPEN"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {page.note && <div className="l4-step-note">{page.note}</div>}
                </>
              )}
            </>
          )}

          {isQuiz && (
            <div className="l4-quiz">
              <p className="l4-question">{page.question}</p>
              <div className="l4-options" role="group" aria-label={page.question}>
                {page.options?.map((option) => (
                  <OptionCard
                    key={option.id}
                    label={option.label}
                    selected={selected === option.id}
                    onClick={() => {
                      if (isCheckedCorrect) return;
                      setSelected(option.id);
                      setFeedback(null);
                    }}
                    className="l4-option"
                  />
                ))}
              </div>
              {feedback && (
                <p className={`l4-feedback ${isCheckedCorrect ? "l4-feedback-good" : "l4-feedback-error"}`}
                  role="status" aria-live="polite">
                  {isCheckedCorrect ? page.correctFeedback :
                    feedback === "empty" ? "Choose a vertex before checking." : page.incorrectFeedback}
                </p>
              )}
            </div>
          )}

          {(page.type === "intro" || page.type === "limit" || page.type === "complete") && (
            <>
              <div className={`l4-information ${page.type === "complete" ? "l4-success" : ""}`}>
                <div className="l4-card-heading">
                  {page.type === "complete" && <Check size={17} strokeWidth={3} aria-hidden="true" />}
                  {page.cardTitle}
                </div>
                <p>{page.cardText}</p>
              </div>
              <div className="l4-takeaway">
                <span>{page.tipTitle}</span>
                <p>{page.tipText}</p>
              </div>
            </>
          )}
        </div>

        <footer className="l4-footer">
          <LessonButton
            label={isCheckedCorrect ? "Next step" : page.button}
            onClick={next}
            className="l4-primary-button"
          />
        </footer>
      </article>
    </main>
  );
}
