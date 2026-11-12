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
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | "empty" | null>(null);

  const page = lesson.pages[index];
  const totalPages = lesson.pages.length;
  const contentBox = page.contentBox;
  const isQuiz = page.type === "quiz";
  const isCheckedCorrect = feedback === "correct";

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
    setFeedback(null);
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

  function navigate(nextIndex: number) {
    setIndex(nextIndex);
  }

  function back() {
    if (index === 0) {
      onExit();
    } else {
      navigate(index - 1);
    }
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

    if (index === totalPages - 1) {
      if (onComplete) onComplete();
      else onExit();
    } else {
      navigate(index + 1);
    }
  }

  const buttonLabel = isQuiz && isCheckedCorrect ? "Continue" : (page.buttonLabel || page.button || "Continue");

  return (
    <div className="w-full min-h-screen bg-[#111116] text-slate-100 p-6 flex flex-col gap-6">
      <LessonHeader lessonNumber={lesson.meta.lessonNumber} onMenuClick={onExit} />

      <ProgressBar currentIndex={index} total={totalPages} onBack={back} />

      <div className="flex-1 flex flex-col gap-4" key={index}>
        <PageTitle category={page.eyebrow || lesson.meta.category} title={page.title} subtext={page.subtext} />

        {/* Main Content Card (Intro, Concepts, Adjacency Lists, or Quiz Prompts) */}
        {page.cardTitle && page.cardText && (
          <InfoCard
            heading={page.cardTitle}
            body={page.cardText}
            variant={page.type === "complete" ? "green" : "default"}
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
              isDirected={contentBox.isDirected ?? false}
            />

            {contentBox.boxType === "graph" && contentBox.text && (
              <p className="text-xs text-slate-400 text-center font-medium">
                {contentBox.text}
              </p>
            )}
          </div>
        )}

        {/* Quiz Options View */}
        {isQuiz && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5" role="group" aria-label={page.cardText}>
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
                heading={isCheckedCorrect ? "That's right!" : "Not quite"}
                body={
                  isCheckedCorrect
                    ? (page.correctFeedback ?? "")
                    : feedback === "empty"
                    ? "Choose an answer before checking."
                    : (page.incorrectFeedback ?? "")
                }
                variant={isCheckedCorrect ? "green" : "red"}
              />
            )}
          </div>
        )}

        {/* Tip / Key Takeaway Section */}
        {page.tipTitle && page.tipText && (!isQuiz || isCheckedCorrect) && (
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