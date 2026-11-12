import { useState, useEffect } from "react";
import { LessonHeader } from "./LessonHeader";
import { PageTitle } from "./PageTitle";
import { ProgressBar } from "./ProgressBar";
import { InfoCard } from "./InfoCard";
import { OptionCard } from "./OptionCard";
import { LessonButton } from "./Buttons";
import { LiveGraph } from "./LiveGraph";
import type { LessonData, LessonPage, GraphState } from "../types/lesson";
import { playNoteSound } from "../helpers";

interface Lesson2ExperienceProps {
  lesson: LessonData;
  onExit: () => void;
  onComplete?: () => void;
}

export function Lesson2Experience({ lesson, onExit, onComplete }: Lesson2ExperienceProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);

  const page = lesson.pages[index];
  const totalPages = lesson.pages.length;
  const contentBox = page.contentBox;
  const isQuiz = page.type === "quiz";
  const isCheckpoint = page.type === "checkpoint";

  const [graphState, setGraphState] = useState<GraphState | null>(() => {
    if (contentBox && (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz")) {
      return contentBox.state ?? null;
    }
    return null;
  });

  useEffect(() => {
    if (contentBox && (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz")) {
      setGraphState(contentBox.state ?? null);
    } else {
      setGraphState(null);
    }
    setSelected(null);
    setQuizChecked(false);
    setErrorMessage(null);
  }, [index]);

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

  function back() {
    if (index === 0) {
      onExit();
    } else {
      setIndex(index - 1);
    }
  }

  function next() {
    if (isQuiz) {
      if (!quizChecked) {
        if (!selected) {
          setErrorMessage("Choose an answer before checking.");
          return;
        }
        const correct = selected === page.correctAnswerId;
        setIsCorrect(correct);
        setQuizChecked(true);
        setErrorMessage(null);

        if (correct) {
          // Advance straight to checkpoint if correct
          setIndex(index + 1);
        }
        return;
      } else {
        // If they clicked "Try again" after getting it wrong, reset back to the quiz question
        if (!isCorrect) {
          setQuizChecked(false);
          setSelected(null);
          setIsCorrect(null);
          return;
        }
      }
    }

    if (index === totalPages - 1) {
      if (onComplete) onComplete();
      else onExit();
    } else {
      setIndex(index + 1);
    }
  }

  // Determine button label dynamically
  let buttonLabel = page.buttonLabel || page.button || "Continue";
  if (isQuiz && quizChecked && !isCorrect) {
    buttonLabel = "Try again";
  }

  // Dynamic styling for checkpoint screen
  const cardTitle = isCheckpoint && !isCorrect ? "Not quite" : (page.cardTitle || "");
  const cardText = isCheckpoint && !isCorrect ? (page.incorrectFeedback || "Review the arrow direction and try again.") : (page.cardText || "");
  const cardVariant = isCheckpoint && !isCorrect ? "red" : (page.type === "complete" || (isCheckpoint && isCorrect) ? "green" : "default");

  return (
    <div className="w-full min-h-screen bg-[#111116] text-slate-100 p-6 flex flex-col gap-6">
      <LessonHeader lessonNumber={lesson.meta.lessonNumber} onMenuClick={onExit} />

      <ProgressBar currentIndex={index} total={totalPages} onBack={back} />

      <div className="flex-1 flex flex-col gap-4" key={index}>
        <PageTitle category={page.eyebrow || lesson.meta.category} title={page.title} subtext={page.subtext} />

        {/* Main Card Content */}
        {cardTitle && cardText && !isQuiz && (
          <InfoCard
            heading={cardTitle}
            body={cardText}
            variant={cardVariant}
          />
        )}

        {/* Interactive Graph Box */}
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
          </div>
        )}

        {/* Quiz View */}
        {isQuiz && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5" role="group" aria-label={page.cardText}>
              {page.options?.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  selected={selected === option.id}
                  onClick={() => {
                    if (quizChecked && isCorrect) return;
                    setSelected(option.id);
                    setErrorMessage(null);
                  }}
                />
              ))}
            </div>

            {quizChecked && !isCorrect && (
              <InfoCard
                heading="Incorrect"
                body={page.incorrectFeedback || "That's not quite right."}
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

        {/* Tip / Key Takeaway Section (Only show explanation why if correct) */}
        {page.tipTitle && page.tipText && (!isQuiz || (isCheckpoint && isCorrect)) && (
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

      <LessonButton label={buttonLabel} onClick={next} />
    </div>
  );
}