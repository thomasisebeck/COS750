import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { LessonHeader } from "./LessonHeader";
import { PageTitle } from "./PageTitle";
import { ProgressBar } from "./ProgressBar";
import { InfoCard } from "./InfoCard";
import { OptionCard } from "./OptionCard";
import { LessonButton } from "./Buttons";
import { LiveGraph } from "./LiveGraph";
import { continuePathCostQuestion, generateRetryQuestion, highlightedRoute, quizExplanation } from "../lessons/lesson3Questions";
import type { GraphQuizContentBox, GraphState, LessonData, LessonPage } from "../types/lesson";
import { playNoteSound, playFeedbackSound } from "../helpers";

interface Lesson3ExperienceProps {
  lesson: LessonData;
  onExit: () => void;
  onComplete: () => void;
}

const SECOND_QUIZ_INDEX = 5;
const RECOVERY_INDEX = 6;
const COMPLETION_INDEX = 7;

function graphForPage(page: LessonPage): GraphState | null {
  const box = page.contentBox;
  return box && (box.boxType === "graph" || box.boxType === "graph-quiz")
    ? { ...box.state, nodes: box.state.nodes.map((node) => ({ ...node })), edges: box.state.edges.map((edge) => ({ ...edge })) }
    : null;
}

/** Lesson 3 uses the shared lesson cards and the existing interactive graph. */
export function Lesson3Experience({ lesson, onExit, onComplete }: Lesson3ExperienceProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctAnswerChecked, setCorrectAnswerChecked] = useState(false);
  const [notice, setNotice] = useState("");
  const [recoveryOrigin, setRecoveryOrigin] = useState(SECOND_QUIZ_INDEX);
  const [missedQuestion, setMissedQuestion] = useState<GraphQuizContentBox | null>(null);
  const [retryCounts, setRetryCounts] = useState<Record<number, number>>({});
  const [retryQuestions, setRetryQuestions] = useState<Partial<Record<number, GraphQuizContentBox>>>({});
  const [graphState, setGraphState] = useState<GraphState | null>(() => graphForPage(lesson.pages[0]));

  const page = lesson.pages[pageIndex];
  const box = retryQuestions[pageIndex] ?? page.contentBox ?? { boxType: "text" as const, title: "", text: "" };
  const isQuiz = box.boxType === "graph-quiz";

  function moveTo(index: number, replacement?: GraphQuizContentBox) {
    const targetPage = lesson.pages[index];
    setGraphState(graphForPage(replacement ? { ...targetPage, contentBox: replacement } :
      retryQuestions[index] ? { ...targetPage, contentBox: retryQuestions[index] } : targetPage));
    setPageIndex(index);
    setSelectedOption(null);
    setCorrectAnswerChecked(false);
    setNotice("");
  }

  function tryAnotherQuestion() {
    const original = lesson.pages[recoveryOrigin].contentBox;
    if (original?.boxType !== "graph-quiz") return;
    const attempt = (retryCounts[recoveryOrigin] ?? 0) + 1;
    const previous = retryQuestions[recoveryOrigin] ?? original;
    const generated = generateRetryQuestion(original, previous, attempt);
    setRetryCounts((previousCounts) => ({ ...previousCounts, [recoveryOrigin]: attempt }));
    // If the first route quiz was retried, the following cost quiz must use that
    // same set of vertices and edge weights, rather than its original JSON graph.
    const nextTemplate = lesson.pages[SECOND_QUIZ_INDEX]?.contentBox;
    const continuation = recoveryOrigin !== SECOND_QUIZ_INDEX &&
      nextTemplate?.boxType === "graph-quiz" && generated.state
        ? continuePathCostQuestion(nextTemplate, generated.state)
        : null;
    setRetryQuestions((previousQuestions) => ({
      ...previousQuestions,
      [recoveryOrigin]: generated,
      ...(continuation ? { [SECOND_QUIZ_INDEX]: continuation } : {}),
    }));
    setMissedQuestion(null);
    moveTo(recoveryOrigin, generated);
  }

  function goBack() {
    if (pageIndex === 0) {
      onExit();
    } else if (pageIndex === RECOVERY_INDEX) {
      tryAnotherQuestion();
    } else if (pageIndex === COMPLETION_INDEX) {
      moveTo(SECOND_QUIZ_INDEX);
    } else {
      moveTo(pageIndex - 1);
    }
  }

  function goForward() {
    if (pageIndex === COMPLETION_INDEX) {
      onComplete();
      return;
    }
    if (pageIndex === RECOVERY_INDEX) {
      tryAnotherQuestion();
      return;
    }
    if (isQuiz && !correctAnswerChecked) {
      if (!selectedOption) {
        setNotice("Choose an answer before checking.");
        return;
      }
      playFeedbackSound(selectedOption === box.correctAnswerId);
      if (selectedOption !== box.correctAnswerId) {
        setMissedQuestion(box);
        setRecoveryOrigin(pageIndex);
        moveTo(RECOVERY_INDEX);
        return;
      }
      setCorrectAnswerChecked(true);
      setNotice(quizExplanation(box));
      return;
    }
    moveTo(pageIndex === SECOND_QUIZ_INDEX ? COMPLETION_INDEX : pageIndex + 1);
  }

  const handleNodeClick = (nodeId: string) => {
    setGraphState((prev: GraphState | null) => {
      if (!prev) return null;
      const isHighlighted = prev.highlightedNodes.includes(nodeId);
      const nextNodes = isHighlighted
        ? prev.highlightedNodes.filter((id: string) => id !== nodeId)
        : [...prev.highlightedNodes, nodeId];

      const nextNodesSet = new Set(nextNodes);
      const validEdges = prev.highlightedEdges.filter((edgeId: string) => {
        const edge = prev.edges.find((e) => e.id === edgeId);
        if (!edge) return false;
        return nextNodesSet.has(edge.source) && nextNodesSet.has(edge.target);
      });

      playNoteSound(nextNodes.length + validEdges.length);

      return {
        ...prev,
        highlightedNodes: nextNodes,
        highlightedEdges: validEdges,
      };
    });
  };

  const handleEdgeClick = (edgeId: string) => {
    setGraphState((prev: GraphState | null) => {
      if (!prev) return null;
      const isHighlighted = prev.highlightedEdges.includes(edgeId);
      const nextEdges = isHighlighted
        ? prev.highlightedEdges.filter((id: string) => id !== edgeId)
        : [...prev.highlightedEdges, edgeId];

      playNoteSound(prev.highlightedNodes.length + nextEdges.length);

      return {
        ...prev,
        highlightedEdges: nextEdges,
      };
    });
  };

  // Highlight the route represented by the selected answer, when appropriate.
  const shownGraph = graphState && isQuiz && box.retryGenerator?.kind === "compare-routes"
    ? (() => {
        const selectedRoute = box.retryGenerator.routes.find((route) => route.optionId === selectedOption);
        return selectedRoute ? highlightedRoute(graphState, selectedRoute.path) : graphState;
      })()
    : graphState;

  return (
    <div className="pf-screen pf-lesson-screen">
      <LessonHeader lessonNumber={3} onMenuClick={onExit} />
      <ProgressBar currentIndex={pageIndex} total={lesson.pages.length} onBack={goBack} />

      <div className="flex-1 flex flex-col gap-4" key={pageIndex}>
        <PageTitle
          category={page.category ?? lesson.meta.category}
          title={page.title}
          subtext={page.subtext}
        />

        {box.boxType === "text" && (
          <InfoCard
            heading={box.title ?? ""}
            body={pageIndex === RECOVERY_INDEX && missedQuestion
              ? `Let's break it down.\n${quizExplanation(missedQuestion)}\n\nNext, we will use the updated graph for the following question too.`
              : box.text ?? ""}
            variant={pageIndex === RECOVERY_INDEX ? "red" : "default"}
          />
        )}

        {(box.boxType === "graph" || box.boxType === "graph-quiz") && shownGraph && (
          <div className="flex flex-col gap-2">
            <LiveGraph
              nodes={shownGraph.nodes}
              edges={shownGraph.edges}
              highlightedNodeIds={shownGraph.highlightedNodes}
              highlightedEdgeIds={shownGraph.highlightedEdges}
              width={260}
              height={180}
              isDirected={false}
              mustSelectPath={!box.prohibitPathSelection}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onNodeMove={(nodeId, x, y) => {
                setGraphState((current) => current && ({
                  ...current,
                  nodes: current.nodes.map((node) => node.id === nodeId ? { ...node, x, y } : node),
                }));
              }}
              onReset={() => setGraphState(graphForPage({ ...page, contentBox: box }))}
            />
            <p className="text-xs text-slate-400 text-center">
              Drag vertices to explore the graph. Edge labels are costs.
            </p>
          </div>
        )}

        {isQuiz && (
          <div className="flex flex-col gap-4">
            {(retryCounts[pageIndex] ?? 0) > 0 && (
              <p className="text-xs font-semibold text-violet-300" aria-live="polite">
                New graph, continued learning · Attempt {(retryCounts[pageIndex] ?? 0) + 1}
              </p>
            )}
            <p className="text-sm font-bold text-slate-100">{box.question}</p>
            <div className="flex flex-col gap-2.5" role="group" aria-label={box.question}>
              {box.options.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  selected={selectedOption === option.id}
                  onClick={() => {
                    if (correctAnswerChecked) return;
                    setSelectedOption(option.id);
                    setNotice("");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {page.extraBox && <InfoCard heading={page.extraBox.title} body={page.extraBox.text} />}

        {notice && (
          <div role="status" aria-live="polite">
            <InfoCard
              heading={correctAnswerChecked ? "Correct!" : "Notice"}
              body={notice}
              variant={correctAnswerChecked ? "green" : "red"}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <LessonButton
          label={isQuiz && correctAnswerChecked ? "Continue" : page.buttonLabel}
          onClick={goForward}
        />
        {pageIndex === COMPLETION_INDEX && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
            <ArrowRight size={13} /> Lesson 04: Dijkstra's algorithm
          </div>
        )}
      </div>
    </div>
  );
}