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
import { lesson1Retry, lesson1FollowUp } from "../lessons/questionBanks";
import type { GraphQuizContentBox } from "../types/lesson";

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

  const [retryQuestions, setRetryQuestions] = useState<Partial<Record<number, GraphQuizContentBox>>>({});
  const [retryCount, setRetryCount] = useState<Record<number,number>>({});
  const [continuationGraph,setContinuationGraph] = useState<GraphState | null>(null);
  const currentPage: LessonPage = lesson.pages[currentPageIndex];
  const totalPages = lesson.pages.length;
  const contentBox = retryQuestions[currentPageIndex] ?? currentPage.contentBox;
  const isQuiz = currentPage.contentBox?.boxType === "graph-quiz";

  const [graphState, setGraphState] = useState<GraphState | null>(() => {
    if (contentBox && (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz")) {
      return contentBox.state ?? null;
    }
    return null;
  });

  function navigate(nextIndex: number) {
    const nextContent = retryQuestions[nextIndex] ?? lesson.pages[nextIndex]?.contentBox;
    setCurrentPageIndex(nextIndex);
    setGraphState(nextIndex === 3 && continuationGraph ? continuationGraph :
      nextContent && (nextContent.boxType === "graph" || nextContent.boxType === "graph-quiz")
      ? nextContent.state ?? null : null);
    setSelectedOptionId(null);
    setQuizChecked(false);
    setIsCorrect(null);
    setErrorMessage(null);
  }

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
      setGraphState(currentPageIndex === 3 && continuationGraph ? continuationGraph : contentBox.state ?? null);
    }
  };

  const handleNextClick = () => {
    if (contentBox?.boxType === "graph-quiz") {
      if (!quizChecked) {
        if (!selectedOptionId) {
          setErrorMessage("Choose an answer before checking.");
          return;
        }
        const correct = selectedOptionId === contentBox.correctAnswerId;
        setIsCorrect(correct);
        playFeedbackSound(correct);
        setQuizChecked(true);
        setErrorMessage(null);
        return; 
      } else if (quizChecked && isCorrect) {
        if (currentPageIndex < totalPages - 1) {
          navigate(currentPageIndex + 1);
        } else {
          onComplete();
        }
        return;
      } else {
        // A similar question uses a new, internally consistent graph and answer.
        const attempt = (retryCount[currentPageIndex] ?? 0) + 1;
        const regenerated = lesson1Retry(currentPageIndex, attempt);
        setRetryQuestions(previous => ({
          ...previous,[currentPageIndex]:regenerated,
          ...(currentPageIndex === 2 ? {4:lesson1FollowUp(regenerated.state,attempt)} : {}),
        }));
        if (currentPageIndex === 2) setContinuationGraph(regenerated.state);
        setRetryCount(previous => ({...previous,[currentPageIndex]:attempt}));
        setGraphState(regenerated.state);
        setQuizChecked(false);
        setIsCorrect(null);
        setSelectedOptionId(null);
        setErrorMessage("New graph, same skill. Look closely and try again.");
        return;
      }
    }

    if (currentPageIndex < totalPages - 1) {
      navigate(currentPageIndex + 1);
    } else {
      onComplete();
    }
  };

  // Determine button label dynamically
  let buttonLabel = currentPage.buttonLabel || "Continue";
  if (isQuiz && quizChecked && isCorrect) {
    buttonLabel = "Continue";
  } else if (isQuiz && quizChecked && !isCorrect) {
    buttonLabel = "Try a new question";
  }

  return (
    <div className="pf-screen pf-lesson-screen">
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
            navigate(Math.max(0, currentPageIndex - 1));
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
              isDirected={contentBox.isDirected ?? false}
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
                    body={contentBox.explanation ?? "Great job! You identified the correct answer."}
                    variant="green"
                  />
                )}

                {quizChecked && !isCorrect && (
                  <InfoCard
                    heading="Incorrect"
                    body={contentBox.explanation ?? "Look closely at the highlighted vertices and edges, then try a different answer."}
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