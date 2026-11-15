import { useState } from "react";
import { LessonHeader } from "./LessonHeader";
import { PageTitle } from "./PageTitle";
import { ProgressBar } from "./ProgressBar";
import { InfoCard } from "./InfoCard";
import { OptionCard } from "./OptionCard";
import { LessonButton } from "./Buttons";
import { LiveGraph } from "./LiveGraph";
import type { LessonData, GraphState } from "../types/lesson";
import { playNoteSound, playFeedbackSound } from "../helpers";
import { lesson2Retry } from "../lessons/questionBanks";

interface Lesson2ExperienceProps {
  lesson: LessonData;
  onExit: () => void;
  onComplete?: () => void;
}

export function Lesson2Experience({ lesson, onExit, onComplete }: Lesson2ExperienceProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [directionAttempt, setDirectionAttempt] = useState(1);
  const directionQuiz = lesson2Retry(directionAttempt);
  const page = lesson.pages[index];
  const totalPages = lesson.pages.length;
  const contentBox = index === 3 ? directionQuiz : page.contentBox;

  // Support quizzes defined either at page level or inside contentBox (graph-quiz / quiz)
  const isQuiz = page.type === "quiz" || page.type === "checkpoint" || contentBox?.boxType === "quiz" || contentBox?.boxType === "graph-quiz";
  const isCheckpoint = page.type === "checkpoint";
  const isDirected = contentBox?.isDirected ?? page.isDirected ?? false;

  const quizOptions = (index === 3 ? directionQuiz.options : page.options) || (contentBox && 'options' in contentBox ? contentBox.options : []);
  const correctAnswerId = (index === 3 ? directionQuiz.correctAnswerId : page.correctAnswerId) || (contentBox && 'correctAnswerId' in contentBox ? contentBox.correctAnswerId : undefined);
  const correctFeedback = (index === 3 ? directionQuiz.explanation : page.correctFeedback) || (contentBox && 'explanation' in contentBox ? contentBox.explanation : undefined) || "Great job!";
  const incorrectFeedback = (index === 3 ? directionQuiz.explanation : page.incorrectFeedback) || (contentBox && 'explanation' in contentBox ? contentBox.explanation : undefined) || "That's not quite right. Select a different option and try again.";

  const [graphState, setGraphState] = useState<GraphState | null>(() => {
    if (contentBox && (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz")) {
      return contentBox.state ?? null;
    }
    return null;
  });

  function navigate(nextIndex: number) {
    const nextBox = nextIndex === 3 ? lesson2Retry(directionAttempt) : lesson.pages[nextIndex]?.contentBox;
    setIndex(nextIndex);
    setGraphState(nextBox && (nextBox.boxType === "graph" || nextBox.boxType === "graph-quiz")
      ? nextBox.state ?? null : null);
    setSelected(null);
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

      const edge = prev.edges.find((e) => e.id === edgeId);
      if (!edge) return prev;

      const isHighlighted = prev.highlightedEdges.includes(edgeId);

      if (!isHighlighted && isDirected) {
        const newNodes = Array.from(new Set([...prev.highlightedNodes, edge.source, edge.target]));
        playNoteSound(newNodes.length + prev.highlightedEdges.length + 1);
        return {
          ...prev,
          highlightedNodes: newNodes,
          highlightedEdges: [...prev.highlightedEdges, edgeId],
        };
      }

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

  function back() {
    if (index === 0) {
      onExit();
    } else {
      navigate(index - 1);
    }
  }

  function next() {
    if (isQuiz && quizOptions && quizOptions.length > 0) {
      if (!quizChecked) {
        if (!selected) {
          setErrorMessage("Choose an answer before checking.");
          return;
        }
        const correct = String(selected) === String(correctAnswerId);
        setIsCorrect(correct);
        playFeedbackSound(correct);
        setQuizChecked(true);
        setErrorMessage(null);

        // Let learners read the feedback before proceeding.
        return;
      } else {
        if (isCorrect) {
          navigate(index + 1);
          return;
        } else {
          if (index === 3) {
            const nextQuestion = lesson2Retry(directionAttempt + 1);
            setDirectionAttempt(previous => previous + 1);
            setGraphState(nextQuestion.state);
          }
          setSelected(null);
          setQuizChecked(false);
          setIsCorrect(null);
          setErrorMessage(null);
          return;
        }
      }
    }

    if (index === totalPages - 1) {
      if (onComplete) onComplete();
      else onExit();
    } else {
      navigate(index + 1);
    }
  }

  // Determine button label dynamically
  let buttonLabel = page.buttonLabel || page.button || "Continue";
  if (isQuiz && quizChecked && isCorrect) {
    buttonLabel = "Continue";
  } else if (isQuiz && quizChecked && !isCorrect) {
    buttonLabel = "Try a new question";
  }

  const cardTitle = isCheckpoint && !isCorrect ? "Not quite" : (page.cardTitle || "");
  const cardText = isCheckpoint && !isCorrect ? (incorrectFeedback || "Review the arrow direction and try again.") : (page.cardText || "");
  const cardVariant = isCheckpoint && !isCorrect ? "red" : (page.type === "complete" || (isCheckpoint && isCorrect) ? "green" : "default");

  return (
    <div className="pf-screen pf-lesson-screen">
      <LessonHeader lessonNumber={lesson.meta.lessonNumber} onMenuClick={onExit} />

      <ProgressBar currentIndex={index} total={totalPages} onBack={back} />

      <div className="flex-1 flex flex-col gap-4" key={index}>
        <PageTitle category={page.eyebrow || lesson.meta.category} title={page.title} subtext={page.subtext} />

        {/* Main Content Card */}
        {cardTitle && cardText && !isQuiz && (
          <InfoCard
            heading={cardTitle}
            body={cardText}
            variant={cardVariant}
          />
        )}

        {/* Interactive LiveGraph Box */}
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
              isDirected={isDirected}
            />

            {contentBox.boxType === "graph" && contentBox.text && (
              <p className="text-xs text-slate-400 text-center font-medium">
                {contentBox.text}
              </p>
            )}
          </div>
        )}

        {index === 3 && <h3 className="pf-quiz-question">{directionQuiz.question}</h3>}

        {/* Quiz Options View */}
        {isQuiz && quizOptions && quizOptions.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5" role="group" aria-label={index === 3 ? directionQuiz.question : page.cardText}>
              {quizOptions.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  selected={selected === option.id}
                  onClick={() => {
                    setSelected(option.id);
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
                body={correctFeedback}
                variant="green"
              />
            )}

            {quizChecked && !isCorrect && (
              <InfoCard
                heading="Incorrect"
                body={incorrectFeedback}
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
          </div>
        )}

        {/* Tip / Key Takeaway Section */}
        {page.tipTitle && page.tipText && (!isQuiz || (isCheckpoint && isCorrect)) && (
          <div className="pf-takeaway">
            <span className="pf-takeaway-label">
              {page.tipTitle}
            </span>
            <p className="pf-takeaway-copy">
              {page.tipText}
            </p>
          </div>
        )}
      </div>

      <LessonButton label={buttonLabel} onClick={next} />
    </div>
  );
}