import { useState } from "react";
import "./App.css";
import { LiveGraph } from "./components/LiveGraph";
import { ProgressBar } from "./components/progressBar";
import { InfoCard } from "./components/infoCard";
import { OptionCard } from "./components/optionCard";
import { LessonButton } from "./components/buttons";
import { LessonHeader } from "./components/LessonHeader";
import { PageTitle } from "./components/PageTitle";
import { LearningPath, type LessonSummary } from "./components/LearningPath";
import lesson1Raw from "./lessons/lesson-1.json";
import lesson6Raw from "./lessons/lesson-6.json";
import lesson2Raw from "./lessons/lesson-2.json"; // Add as you create more
import type { LessonData, LessonPage, GraphState } from "./types/lesson";
import { playNoteSound } from "./helpers";

const lessonsMap: Record<number, LessonData> = {
  1: lesson1Raw as unknown as LessonData,
  2: lesson2Raw as unknown as LessonData,
  6: lesson6Raw as unknown as LessonData,
};

const lessonList: LessonSummary[] = [
  { id: 1, title: "Meet the Graph", subtitle: "Vertices & edges" },
  { id: 2, title: "Follow Connections", subtitle: "Adjacency & direction" },
  { id: 3, title: "Weigh Your Options", subtitle: "Paths & costs" },
  { id: 4, title: "Find the Route", subtitle: "Dijkstra explained" },
  { id: 5, title: "Think Like Dijkstra", subtitle: "Guided practice" },
  { id: 6, title: "Prove Your Skills", subtitle: "Independent assessment" },
];

function App() {
  const [view, setView] = useState<"menu" | "lesson">("menu");
  const [currentLessonId, setCurrentLessonId] = useState<number>(1);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const lessonData = lessonsMap[currentLessonId] ?? lessonsMap[1];
  const currentPage: LessonPage = lessonData.pages[currentPageIndex];
  const totalPages = lessonData.pages.length;
  const contentBox = currentPage.contentBox;

  const [graphState, setGraphState] = useState<GraphState | null>(() => {
    if (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz") {
      return contentBox.state;
    }
    return null;
  });

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const quiz = contentBox.boxType === "quiz" || contentBox.boxType === "graph-quiz" ? contentBox : null;
  const score = lessonData.pages.reduce((sum, page, index) => {
    const box = page.contentBox;
    return sum + ((box.boxType === "quiz" || box.boxType === "graph-quiz") && answers[index] === box.correctAnswerId ? 1 : 0);
  }, 0);
  const questionCount = lessonData.pages.filter(page => page.contentBox.boxType === "quiz" || page.contentBox.boxType === "graph-quiz").length;
  const goToPage = (index: number) => {
    const box = lessonData.pages[index].contentBox;
    setCurrentPageIndex(index);
    setGraphState(box.boxType === "graph" || box.boxType === "graph-quiz" ? box.state : null);
    setSelectedOptionId(answers[index] ?? null);
    setChecked(answers[index] !== undefined);
  };

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
    if (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz") {
      setGraphState(contentBox.state);
    }
  };

  if (view === "menu") {
    return (
      <LearningPath
        lessons={lessonList}
        selectedLessonId={currentLessonId}
        onSelectLesson={(id) => setCurrentLessonId(id)}
        onStartLesson={(id) => {
          if (!lessonsMap[id]) return; // Prevents opening lessons without JSON yet
          setCurrentLessonId(id);
          setAnswers({});
          setChecked(false);
          setSelectedOptionId(null);
          const box = lessonsMap[id].pages[0].contentBox;
          setGraphState(box.boxType === "graph" || box.boxType === "graph-quiz" ? box.state : null);
          setCurrentPageIndex(0);
          setView("lesson");
        }}
      />
    );
  }

  return (
    <div className={`w-full min-h-screen bg-[#111116] text-slate-100 p-6 flex flex-col gap-6 ${currentLessonId === 6 ? "lesson-six" : ""}`}>
      <LessonHeader
        lessonNumber={lessonData.meta.lessonNumber}
        onMenuClick={() => { setCurrentPageIndex(0); setView("menu"); }}
      />

      <ProgressBar
        currentIndex={currentPageIndex}
        total={totalPages}
        onBack={() => goToPage(Math.max(0, currentPageIndex - 1))}
      />

      <div className="flex-1 flex flex-col gap-4">
        <PageTitle
          category={lessonData.meta.category}
          title={currentPage.title}
          subtext={currentPage.subtext}
        />

        {contentBox.boxType === "text" && (
          <InfoCard heading={contentBox.title} body={contentBox.text} />
        )}

        {(contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz") &&
          graphState && (
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
            {quiz.options.map(option => (
              <OptionCard key={option.id} label={option.label}
                selected={selectedOptionId === option.id}
                disabled={checked}
                onClick={() => setSelectedOptionId(option.id)} />
            ))}
            {checked && <div role="status"><InfoCard
              variant={selectedOptionId === quiz.correctAnswerId ? "green" : "red"}
              heading={selectedOptionId === quiz.correctAnswerId ? "Correct!" : "Keep learning"}
              body={`${quiz.explanation ?? "Correct answer: " + quiz.options.find(option => option.id === quiz.correctAnswerId)?.label}`} />
            </div>}
          </div>
        )}
        {currentPage.pageType === "results" && (
          <div className="flex flex-col gap-4" aria-live="polite">
            <div className="text-center py-5"><span className="text-5xl text-amber-300" aria-hidden="true">&#9733;</span>
              <p className="text-xl font-bold mt-3">{score} / {questionCount}</p>
              <p className="text-sm text-slate-400">{score >= 8 ? "Excellent work!" : "Every answer is a step forward."}</p>
            </div>
            <InfoCard variant="green" heading="YOUR SKILLS" body={`${score} correct answers out of ${questionCount}. ${questionCount - score} topics to revisit.`} />
            {lessonData.pages.map((page, index) => {
              const box = page.contentBox;
              if (box.boxType !== "quiz" && box.boxType !== "graph-quiz") return null;
              return <InfoCard key={index} variant={answers[index] === box.correctAnswerId ? "green" : "red"}
                heading={page.title} body={box.explanation ?? box.options.find(option => option.id === box.correctAnswerId)!.label} />;
            })}
            <LessonButton label="Try assessment again" onClick={() => {
              setAnswers({}); setCurrentPageIndex(0); setChecked(false); setSelectedOptionId(null);
              const box = lessonData.pages[0].contentBox;
              setGraphState(box.boxType === "graph" || box.boxType === "graph-quiz" ? box.state : null);
            }} />
          </div>
        )}

        {currentPage.pageType === "review" && (() => {
          const missed = lessonData.pages.find((page, index) => {
            const box = page.contentBox;
            return (box.boxType === "quiz" || box.boxType === "graph-quiz") && answers[index] !== box.correctAnswerId;
          });
          const box = missed?.contentBox;
          return <InfoCard heading={missed ? `Practise: ${missed.title}` : "Ready for a bigger challenge"}
            body={box && (box.boxType === "quiz" || box.boxType === "graph-quiz")
              ? box.explanation ?? "Review the explanation and try the assessment again."
              : "You answered every question correctly. Try applying Dijkstra?s algorithm to a graph with more vertices."} />;
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
        onClick={() => {
          if (quiz && !checked) {
            if (!selectedOptionId) return;
            setAnswers(previous => ({ ...previous, [currentPageIndex]: selectedOptionId }));
            setChecked(true);
            return;
          }
          if (currentPageIndex < totalPages - 1) {
            goToPage(currentPageIndex + 1);
          } else {
            if (currentLessonId < lessonList.length) {
              setCurrentLessonId((prev) => prev + 1);
            }
            setCurrentPageIndex(0);
            setView("menu");
          }
        }}
      />
    </div>
  );
}

export default App;