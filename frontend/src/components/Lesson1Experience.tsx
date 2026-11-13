import { useState, useEffect } from "react";
import { LessonHeader } from "./LessonHeader";
import { ProgressBar } from "./ProgressBar";
import { PageTitle } from "./PageTitle";
import { InfoCard } from "./InfoCard";
import { OptionCard } from "./OptionCard";
import { LessonButton } from "./Buttons";
import { LiveGraph } from "./LiveGraph";
import type { LessonData, LessonPage, GraphState } from "../types/lesson";
import { playNoteSound } from "../helpers";

interface LessonExperienceProps {
  lesson: LessonData;
  onExit: () => void;
  onComplete: () => void;
}

export function Lesson1Experience({
  lesson,
  onExit,
  onComplete,
}: LessonExperienceProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentPage: LessonPage = lesson.pages[currentPageIndex];
  const totalPages = lesson.pages.length;
  const contentBox = currentPage.contentBox;
  const isQuiz = currentPage.contentBox?.boxType === "graph-quiz";

  const [graphState, setGraphState] = useState<GraphState | null>(() => {
    if (contentBox && (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz")) {
      return contentBox.state ?? null;
    }
    return null;
  });

  const navigateTo = (index: number) => {
    setCurrentPageIndex(index);
  };

  useEffect(() => {
    const nextBox = lesson.pages[currentPageIndex]?.contentBox;
    if (nextBox && (nextBox.boxType === "graph" || nextBox.boxType === "graph-quiz")) {
      setGraphState(nextBox.state ?? null);
    } else {
      setGraphState(null);
    }
    setSelectedOptionId(null);
    setQuizChecked(false);
    setIsCorrect(null);
    setErrorMessage(null);
  }, [currentPageIndex, lesson]);

  const handleNodeMove = (nodeId: string, x: number, y: number) => {
    setGraphState((prev: GraphState | null) => {
      if (!prev) return null;
      return {
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === nodeId ? { ...node, x, y } : node,
        ),
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
    if (isQuiz) {
      if (!quizChecked) {
        if (!selectedOptionId) {
          setErrorMessage("Choose an answer before checking.");
          return;
        }
        const correct = selectedOptionId === contentBox.correctAnswerId;
        setIsCorrect(correct);
        setQuizChecked(true);
        setErrorMessage(null);
        return; // Stay on screen to show success/error card
      } else if (quizChecked && isCorrect) {
        // If already checked and correct, clicking continue advances to next page
        if (currentPageIndex < totalPages - 1) {
          navigateTo(currentPageIndex + 1);
        } else {
          onComplete();
        }
        return;
      }
    }

    if (currentPageIndex < totalPages - 1) {
      navigateTo(currentPageIndex + 1);
    } else {
      onComplete();
    }
  };

  // Determine button label dynamically
  let buttonLabel = currentPage.buttonLabel || "Continue";
  if (isQuiz && quizChecked && isCorrect) {
    buttonLabel = "Continue";
  } else if (isQuiz && quizChecked && !isCorrect) {
    buttonLabel = "Try again";
  }

  return (
    <div className="w-full min-h-screen bg-[#111116] text-slate-100 p-6 flex flex-col gap-6">
      <LessonHeader
        lessonNumber={lesson.meta.lessonNumber}
        onMenuClick={onExit}
      />

      <ProgressBar
        currentIndex={currentPageIndex}
        total={totalPages}
        onBack={() => {
          if (currentPageIndex === 0) {
            onExit();
          } else {
            navigateTo(Math.max(0, currentPageIndex - 1));
          }
        }}
      />

      <div className="flex-1 flex flex-col gap-4" key={currentPageIndex}>
        <PageTitle
          category={currentPage.category}
          title={currentPage.title}
          subtext={currentPage.subtext}
        />

        {contentBox && contentBox.boxType === "text" && (
          <InfoCard
            heading={contentBox.title || ""}
            body={contentBox.text || ""}
            variant={contentBox.variant}
          />
        )}

        {contentBox && (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz") && graphState && (
          <div className="flex flex-col gap-4">
            <LiveGraph
              nodes={graphState.nodes}
              edges={graphState.edges}
              highlightedNodeIds={graphState.highlightedNodes}
              highlightedEdgeIds={graphState.highlightedEdges}
              onNodeMove={handleNodeMove}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onReset={handleReset}
              mustSelectPath={!contentBox.prohibitPathSelection}
            />

            {contentBox.boxType === "graph" && contentBox.text && (
              <p className="text-xs text-slate-400 text-center font-medium">
                {contentBox.text}
              </p>
            )}

            {contentBox.boxType === "graph-quiz" && (
              <>
                {contentBox.question && (
                  <h3 className="text-sm font-bold text-slate-100">
                    {contentBox.question}
                  </h3>
                )}

                <div className="flex flex-col gap-2.5">
                  {contentBox.options?.map((option) => (
                    <OptionCard
                      key={option.id}
                      label={option.label}
                      selected={selectedOptionId === option.id}
                      onClick={() => {
                        setSelectedOptionId(option.id);
                        setQuizChecked(false);
                        setIsCorrect(null);
                        setErrorMessage(null);
                      }}
                    />
                  ))}
                </div>

                {quizChecked && isCorrect && (
                  <InfoCard
                    heading="That's right!"
                    body="Great job! You identified the correct answer."
                    variant="green"
                  />
                )}

                {quizChecked && !isCorrect && (
                  <InfoCard
                    heading="Incorrect"
                    body="That's not quite right. Select a different option and try again."
                    variant="red"
                  />
                )}

                {errorMessage && (
                  <InfoCard
                    heading="Notice"
                    body={errorMessage}
                    variant="red"
                  />
                )}
              </>
            )}
          </div>
        )}

        {currentPage.extraBox && (
          <InfoCard
            heading={currentPage.extraBox.title}
            body={currentPage.extraBox.text}
          />
        )}
      </div>

      <LessonButton
        label={buttonLabel}
        onClick={handleNextClick}
      />
    </div>
  );
}