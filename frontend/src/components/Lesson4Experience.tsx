import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { LessonHeader } from "./LessonHeader";
import { PageTitle } from "./PageTitle";
import { ProgressBar } from "./ProgressBar";
import { InfoCard } from "./InfoCard";
import { LessonButton } from "./Buttons";
import { OptionCard } from "./OptionCard";
import { DijkstraGraph } from "./DijkstraGraph";
import { computeDijkstraTrace, shortestRoute, LESSON4_VERTICES, LESSON4_EDGES, type VertexId } from "../algorithms/dijkstra";
import lesson4Raw from "../lessons/lesson-4.json";

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

/** Ten-screen Dijkstra lesson mapped to modular Tailwind components. */
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
    <div className="w-full min-h-screen bg-[#111116] text-slate-100 p-6 flex flex-col gap-6">
      {/* Lesson Header with 3 dots menu option */}
      <LessonHeader
        lessonNumber={lesson4.meta.lessonNumber}
        onMenuClick={onExit}
      />

      {/* Standard Progress Bar */}
      <ProgressBar
        currentIndex={index}
        total={lesson4.pages.length}
        onBack={back}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4" key={index}>
        <PageTitle
          category={page.eyebrow}
          title={page.title}
          subtext={page.subtext}
        />

        {(page.type === "walkthrough" || page.type === "quiz") && (
          <div className="flex flex-col gap-4">
            <DijkstraGraph
              activeVertex={page.activeVertex ?? null}
              settledVertices={frame.settled}
              highlightedEdges={page.showRoute ? routeEdges : (page.highlightedEdges ?? [])}
              routeVertices={page.showRoute ? finalRoute : []}
            />

            {page.type === "walkthrough" && (
              <>
                <div className="border border-slate-800 bg-slate-900 rounded-xl overflow-hidden shadow-lg p-3">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800">
                        <th scope="col" className="py-2 px-2 font-semibold">VERTEX</th>
                        <th scope="col" className="py-2 px-2 font-semibold">DIST</th>
                        <th scope="col" className="py-2 px-2 font-semibold">PREV</th>
                        <th scope="col" className="py-2 px-2 font-semibold">STATE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {LESSON4_VERTICES.map((vertex) => {
                        const isSettled = frame.settled.includes(vertex);
                        return (
                          <tr key={vertex}>
                            <th scope="row" className="py-2 px-2 text-slate-200 font-bold">{vertex}</th>
                            <td className="py-2 px-2 text-slate-300">{distanceLabel(frame.distances[vertex])}</td>
                            <td className="py-2 px-2 text-slate-300">{frame.predecessors[vertex] ?? "—"}</td>
                            <td className={`py-2 px-2 font-semibold ${isSettled ? "text-emerald-400" : "text-amber-400"}`}>
                              {isSettled ? "SETTLED" : "OPEN"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {page.note && (
                  <p className="text-xs text-slate-400 text-center font-medium bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    {page.note}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {isQuiz && (
          <div className="flex flex-col gap-4">
            {page.question && (
              <h3 className="text-sm font-bold text-slate-100">
                {page.question}
              </h3>
            )}
            <div className="flex flex-col gap-2.5" role="group" aria-label={page.question}>
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
                />
              ))}
            </div>

            {feedback && (
              <InfoCard
                heading={isCheckedCorrect ? "Correct!" : "Incorrect"}
                body={
                  isCheckedCorrect
                    ? (page.correctFeedback ?? "")
                    : feedback === "empty"
                    ? "Choose a vertex before checking."
                    : (page.incorrectFeedback ?? "")
                }
                variant={isCheckedCorrect ? "green" : "red"}
              />
            )}
          </div>
        )}

        {(page.type === "intro" || page.type === "limit" || page.type === "complete") && (
          <div className="flex flex-col gap-4">
            <InfoCard
              heading={page.cardTitle || ""}
              body={page.cardText || ""}
              variant={page.type === "complete" ? "green" : "default"}
            />
            {page.tipTitle && page.tipText && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  {page.tipTitle}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {page.tipText}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <LessonButton
        label={isCheckedCorrect ? "Next step" : page.button}
        onClick={next}
      />
    </div>
  );
}