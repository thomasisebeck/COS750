import { useState, useEffect } from "react";
import "./App.css";
import { LiveGraph } from "./components/LiveGraph";
import { ProgressBar } from "./components/ProgressBar";
import { InfoCard } from "./components/InfoCard";
import { OptionCard } from "./components/OptionCard";
import { LessonButton } from "./components/Buttons";
import { LessonHeader } from "./components/LessonHeader";
import { PageTitle } from "./components/PageTitle";
import lessonRaw from "./lessons/lesson-1.json";
import type { LessonData, LessonPage, GraphState } from "./types/lesson";
import { playNoteSound } from "./helpers";

const lessonData = lessonRaw as unknown as LessonData;

function App() {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const currentPage: LessonPage = lessonData.pages[currentPageIndex];
  const totalPages = lessonData.pages.length;
  const contentBox = currentPage.contentBox;

  const [graphState, setGraphState] = useState<GraphState | null>(() => {
    if (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz") {
      return contentBox.state;
    }
    return null;
  });

  useEffect(() => {
    if (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz") {
      setGraphState(contentBox.state);
    } else {
      setGraphState(null);
    }
    setSelectedOptionId(null);
  }, [currentPageIndex]);

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

  return (
    <div className="w-full min-h-screen bg-[#111116] text-slate-100 p-6 flex flex-col gap-6">
      <LessonHeader lessonNumber={lessonData.meta.lessonNumber} />

      <ProgressBar
        currentIndex={currentPageIndex}
        total={totalPages}
        onBack={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
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
                isDirected={false}
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
                    {contentBox.options.map((option) => (
                      <OptionCard
                        key={option.id}
                        label={option.label}
                        selected={selectedOptionId === option.id}
                        onClick={() => setSelectedOptionId(option.id)}
                      />
                    ))}
                  </div>
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
        label={currentPage.buttonLabel}
        onClick={() => {
          if (currentPageIndex < totalPages - 1) {
            setCurrentPageIndex((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
}

export default App;