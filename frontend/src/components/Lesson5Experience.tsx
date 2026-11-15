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
import { guidedPracticeBank } from "../lessons/questionBanks";
import { RotateCcw } from "lucide-react";

interface Lesson5ExperienceProps {
  lesson: LessonData;
  onExit: () => void;
  onComplete?: () => void;
}

export function Lesson5Experience({ lesson, onExit, onComplete }: Lesson5ExperienceProps) {
  const [index, setIndex] = useState(0);
  const [practice, setPractice] = useState(() => guidedPracticeBank(lesson, Math.floor(Math.random()*24)+1));
  const [selected, setSelected] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const page = practice.pages[index];
  const totalPages = practice.pages.length;
  const contentBox = page.contentBox;
  const isQuiz = page.type === "quiz";
  const isCheckpoint = page.type === "checkpoint";
  const isDirected = contentBox?.isDirected ?? false;

  const [graphState, setGraphState] = useState<GraphState | null>(() => {
    const first = practice.pages[0]?.contentBox;
    const baseGraph = first && "state" in first ? first.state : null;
    if (!baseGraph) return null;
    return getGraphStateForStep(index, baseGraph);
  });

  function navigate(nextIndex: number) {
    const firstBox = practice.pages[0]?.contentBox;
    const baseGraph = firstBox && "state" in firstBox ? firstBox.state : null;
    setIndex(nextIndex);
    setGraphState(baseGraph ? getGraphStateForStep(nextIndex, baseGraph) : null);
    setSelected(null);
    setQuizChecked(false);
    setIsCorrect(null);
    setErrorMessage(null);
  }

  function getGraphStateForStep(stepIndex: number, baseGraph: GraphState): GraphState {
    let highlightedNodes: string[];
    let highlightedEdges: string[];

    switch (stepIndex) {
      case 0: // Intro
        highlightedNodes = [];
        highlightedEdges = [];
        break;
      case 1: // Step 01: Source A
        highlightedNodes = ["A"];
        highlightedEdges = [];
        break;
      case 2: // Step 02: A's neighbours (B, C) and edges e1, e2
        highlightedNodes = ["A", "B", "C"];
        highlightedEdges = ["e1", "e2"];
        break;
      case 3: // Step 03: Choose next vertex (B)
        highlightedNodes = ["A", "B"];
        highlightedEdges = ["e1"];
        break;
      case 4: // Step 04: Shorter way to C via B (edge e3)
        highlightedNodes = ["A", "B", "C"];
        highlightedEdges = ["e1", "e3"];
        break;
      case 5: // Step 05: Record predecessor to D via B (edge e4)
        highlightedNodes = ["A", "B", "D"];
        highlightedEdges = ["e1", "e4"];
        break;
      case 6: // Step 06: Find next minimum (C)
        highlightedNodes = ["A", "B", "C"];
        highlightedEdges = ["e1", "e3"];
        break;
      case 7: // Step 07: Improve D through C (edge e5)
        highlightedNodes = ["A", "B", "C", "D"];
        highlightedEdges = ["e1", "e3", "e5"];
        break;
      case 8: // Step 08: Rebuild path
        highlightedNodes = ["A", "B", "C", "D"];
        highlightedEdges = ["e1", "e3", "e5"];
        break;
      case 9: // Complete
        highlightedNodes = ["A", "B", "C", "D"];
        highlightedEdges = ["e1", "e3", "e5"];
        break;
      default:
        highlightedNodes = ["A", "B", "C", "D"];
        highlightedEdges = ["e1", "e3", "e5"];
        break;
    }

    return {
      ...baseGraph,
      highlightedNodes,
      highlightedEdges,
    };
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
    const first = practice.pages[0]?.contentBox;
    const baseGraph = first && "state" in first ? first.state : null;
    if (baseGraph) {
      setGraphState(getGraphStateForStep(index, baseGraph));
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
    if (isQuiz) {
      if (!quizChecked) {
        if (!selected) {
          setErrorMessage("Choose an answer before checking.");
          return;
        }
        const correct = selected === page.correctAnswerId;
        setIsCorrect(correct);
        playFeedbackSound(correct);
        setQuizChecked(true);
        setErrorMessage(null);
        return;
      } else {
        if (isCorrect) {
          navigate(index + 1);
          return;
        } else {
          // Keep the original question and graph so the student can apply the feedback.
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

  let buttonLabel = page.buttonLabel || page.button || "Continue";
  if (isQuiz && quizChecked && isCorrect) {
    buttonLabel = "Continue";
  } else if (isQuiz && quizChecked && !isCorrect) {
    buttonLabel = "Try again";
  }

  const activeOptions = page.options;
  const cardTitle = isCheckpoint && !isCorrect ? "Not quite" : (page.cardTitle || "");
  const cardText = isCheckpoint && !isCorrect ? (page.incorrectFeedback || "Review the calculation and try again.") : (page.cardText || "");
  const cardVariant = isCheckpoint && !isCorrect ? "red" : (page.type === "complete" || (isCheckpoint && isCorrect) ? "green" : "default");

  return (
    <div className="pf-screen pf-lesson-screen">
      <LessonHeader lessonNumber={lesson.meta.lessonNumber} onMenuClick={onExit} />

      <ProgressBar currentIndex={index} total={totalPages} onBack={back} />

      <div className="flex-1 flex flex-col gap-4" key={index}>
        <PageTitle category={page.eyebrow || lesson.meta.category} title={page.title} subtext={page.subtext} />

        {/* Main Content Card (Shown if not a quiz) */}
        {cardTitle && cardText && !isQuiz && (
          <InfoCard
            heading={cardTitle}
            body={cardText}
            variant={cardVariant}
          />
        )}

        {index === 0 && <button type="button" className="pf-secondary-button" onClick={() => {
          const fresh = guidedPracticeBank(lesson, Math.floor(Math.random()*24)+1);
          setPractice(fresh);
          const freshBox = fresh.pages[0].contentBox;
          if (freshBox?.boxType === "graph") setGraphState(getGraphStateForStep(0,freshBox.state));
          setSelected(null);setQuizChecked(false);setIsCorrect(null);
        }}><RotateCcw size={17}/> Generate another practice graph</button>}

        {/* Persistent Interactive LiveGraph Box with step-by-step highlighting */}
        {graphState && (
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
              mustSelectPath={!(contentBox?.prohibitPathSelection)}
              isDirected={isDirected}
            />

            {contentBox?.text && (
              <p className="text-xs text-slate-400 text-center font-medium">
                {contentBox.text}
              </p>
            )}
          </div>
        )}

        {/* Quiz Question Card Title */}
        {isQuiz && cardTitle && (
          <h3 className="pf-quiz-question">
            {cardTitle}
          </h3>
        )}

        {/* Quiz Options View */}
        {isQuiz && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2.5" role="group" aria-label={page.cardText}>
              {activeOptions?.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  selected={selected === option.id}
                  onClick={() => {
                    setSelected(option.id);
                    setErrorMessage(null);
                    if (quizChecked) {
                      setQuizChecked(false);
                      setIsCorrect(null);
                    }
                  }}
                />
              ))}
            </div>

            {quizChecked && isCorrect && (
              <InfoCard
                heading="That's right!"
                body={page.correctFeedback || "Great job!"}
                variant="green"
              />
            )}

            {quizChecked && !isCorrect && (
              <InfoCard
                heading="Incorrect"
                body={page.incorrectFeedback || "That's not quite right. Select a different option and try again."}
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