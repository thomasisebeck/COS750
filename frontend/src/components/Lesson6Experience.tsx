import { useState } from "react";
import { LessonHeader } from "./LessonHeader";
import { ProgressBar } from "./ProgressBar";
import { PageTitle } from "./PageTitle";
import { InfoCard } from "./InfoCard";
import { OptionCard } from "./OptionCard";
import { LessonButton } from "./Buttons";
import { LiveGraph } from "./LiveGraph";
import type { LessonData, LessonPage, GraphState } from "../types/lesson";
import { playNoteSound, playFeedbackSound } from "../helpers";
import { assessmentBank } from "../lessons/questionBanks";
import { Leaderboard } from "./Leaderboard";

interface Lesson6ExperienceProps {
  lesson: LessonData;
  onExit: () => void;
  onComplete: () => void;
  onScore?: (score: number, total: number) => void;
}

export function Lesson6Experience({ lesson, onExit, onComplete, onScore }: Lesson6ExperienceProps) {
  const [assessment] = useState(() => assessmentBank(lesson, Math.floor(Math.random()*24)+1));
  const [scoreSaved, setScoreSaved] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<boolean>(false);

  const currentPage: LessonPage = assessment.pages[currentPageIndex];
  const totalPages = assessment.pages.length;
  const contentBox = currentPage.contentBox;

  const [graphState, setGraphState] = useState<GraphState | null>(() => {
    if (contentBox && (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz")) {
      return contentBox.state ?? null;
    }
    return null;
  });

  const quiz = contentBox && (contentBox.boxType === "quiz" || contentBox.boxType === "graph-quiz") ? contentBox : null;

  const score = assessment.pages.reduce((sum, page, index) => {
    const box = page.contentBox;
    return sum + (box && (box.boxType === "quiz" || box.boxType === "graph-quiz") && answers[index] === box.correctAnswerId ? 1 : 0);
  }, 0);

  const questionCount = assessment.pages.filter(page => page.contentBox && (page.contentBox.boxType === "quiz" || page.contentBox.boxType === "graph-quiz")).length;

  const goToPage = (index: number) => {
    const box = assessment.pages[index]?.contentBox;
    setCurrentPageIndex(index);
    setGraphState(box && (box.boxType === "graph" || box.boxType === "graph-quiz") ? box.state ?? null : null);
    setSelectedOptionId(answers[index] ?? null);
    setChecked(answers[index] !== undefined);
  };

  const handleNodeMove = (nodeId: string, x: number, y: number) => {
    setGraphState((prev: GraphState | null) => {
      if (!prev) return null;
      return {
        ...prev,
        nodes: prev.nodes.map((node) => (node.id === nodeId ? { ...node, x, y } : node)),
      };
    });
  };

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

  const handleReset = () => {
    if (contentBox && (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz")) {
      setGraphState(contentBox.state ?? null);
    }
  };

  const handleNextClick = () => {
    if (currentPageIndex === 10 && checked && !scoreSaved) {onScore?.(score, questionCount);setScoreSaved(true);}
    if (quiz && !checked) {
      if (!selectedOptionId) return;
      playFeedbackSound(selectedOptionId === quiz.correctAnswerId);
      setAnswers((previous) => ({ ...previous, [currentPageIndex]: selectedOptionId }));
      setChecked(true);
      return;
    }

    if (currentPageIndex < totalPages - 1) {
      goToPage(currentPageIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="pf-screen pf-lesson-screen">
      <LessonHeader
        lessonNumber={lesson.meta.lessonNumber}
        onMenuClick={() => {
          setCurrentPageIndex(0);
          onExit();
        }}
      />

      <ProgressBar
        currentIndex={currentPageIndex}
        total={totalPages}
        onBack={() => goToPage(Math.max(0, currentPageIndex - 1))}
      />

      {/* Fluid layout wrapper matching Lesson 2 structure */}
      <div className="flex-1 flex flex-col gap-4" key={currentPageIndex}>
        <PageTitle
          category={lesson.meta.category}
          title={currentPage.title}
          subtext={currentPage.subtext}
        />

        {contentBox && contentBox.boxType === "text" && (
          <InfoCard heading={contentBox.title || ""} body={contentBox.text || ""} variant={contentBox.variant} />
        )}

        {contentBox && (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz") && graphState && (
          <div className="flex flex-col gap-4">
            <LiveGraph
              nodes={graphState.nodes}
              edges={graphState.edges}
              highlightedNodeIds={graphState.highlightedNodes}
              highlightedEdgeIds={graphState.highlightedEdges}
              onNodeMove={contentBox.readOnly ? undefined : handleNodeMove}
              onNodeClick={contentBox.readOnly ? undefined : handleNodeClick}
              onEdgeClick={contentBox.readOnly ? undefined : handleEdgeClick}
              onReset={contentBox.readOnly ? undefined : handleReset}
              isDirected={contentBox.isDirected}
              readOnly={contentBox.readOnly}
              mustSelectPath={!contentBox.prohibitPathSelection}
            />

            {contentBox.boxType === "graph" && contentBox.text && (
              <p className="text-xs text-slate-400 text-center font-medium">
                {contentBox.text}
              </p>
            )}
          </div>
        )}

        {quiz && (
          <div className="flex flex-col gap-3 text-left">
            <h3 className="text-sm font-semibold">{quiz.question}</h3>
            {quiz.options?.map((option) => (
              <OptionCard
                key={option.id}
                label={option.label}
                selected={selectedOptionId === option.id}
                disabled={checked}
                onClick={() => setSelectedOptionId(option.id)}
              />
            ))}
            {checked && (
              <div role="status">
                <InfoCard
                  variant={selectedOptionId === quiz.correctAnswerId ? "green" : "red"}
                  heading={selectedOptionId === quiz.correctAnswerId ? "Correct!" : "Keep learning"}
                  body={`${quiz.explanation ?? "Correct answer: " + quiz.options?.find((option) => option.id === quiz.correctAnswerId)?.label}`}
                />
              </div>
            )}
          </div>
        )}

        {currentPage.pageType === "results" && (
          <div className="flex flex-col gap-4" aria-live="polite">
            <div className="text-center py-5">
              <span className="text-5xl text-amber-300" aria-hidden="true">&#9733;</span>
              <p className="text-xl font-bold mt-3">{score} / {questionCount}</p>
              <p className="text-sm text-slate-400">{score >= 8 ? "Excellent work!" : "Every answer is a step forward."}</p>
            </div>
            
            <Leaderboard userScore={score} total={questionCount} compact />
            {assessment.pages.map((page, index) => {
              const box = page.contentBox;
              if (!box || (box.boxType !== "quiz" && box.boxType !== "graph-quiz")) return null;
              return (
                <InfoCard
                  key={index}
                  variant={answers[index] === box.correctAnswerId ? "green" : "red"}
                  heading={page.title}
                  body={box.explanation ?? box.options?.find((option) => option.id === box.correctAnswerId)?.label ?? ""}
                />
              );
            })}

            <LessonButton
              label="Try assessment again"
              onClick={() => {
                setAnswers({});
                setCurrentPageIndex(0);
                setChecked(false);
                setSelectedOptionId(null);
                goToPage(0);
              }}
            />
          </div>
        )}

        {currentPage.pageType === "review" && (() => {
          const missed = assessment.pages.find((page, index) => {
            const box = page.contentBox;
            return box && (box.boxType === "quiz" || box.boxType === "graph-quiz") && answers[index] !== box.correctAnswerId;
          });
          const box = missed?.contentBox;
          return (
            <InfoCard
              heading={missed ? `Practise: ${missed.title}` : "Ready for a bigger challenge"}
              body={box && (box.boxType === "quiz" || box.boxType === "graph-quiz")
                ? box.explanation ?? "Review the explanation and try the assessment again."
                : "You answered every question correctly."}
            />
          );
        })()}

        {currentPage.extraBox && (
          <InfoCard
            heading={currentPage.extraBox.title}
            body={currentPage.extraBox.text}
          />
        )}
      </div>

      <LessonButton
        label={quiz && checked ? "Continue" : currentPage.buttonLabel}
        disabled={!!quiz && !selectedOptionId}
        onClick={handleNextClick}
      />
    </div>
  );
}