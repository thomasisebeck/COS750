import { useState, useEffect } from "react";
import "./App.css";
import { Sparkles, ChevronLeft, ArrowRight } from "lucide-react";
import { LiveGraph } from "./components/LiveGraph";
import lessonRaw from "./lessons/lesson-1.json";
import type { LessonData, LessonPage, GraphState } from "./types/lesson";
import { playNoteSound } from "./helpers";

// Type-cast the imported raw JSON
const lessonData = lessonRaw as unknown as LessonData;

function App() {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const currentPage: LessonPage = lessonData.pages[currentPageIndex];
  const totalPages = lessonData.pages.length;

  const contentBox = currentPage.contentBox;

  // Initialize graphState safely with type narrowing
  const [graphState, setGraphState] = useState<GraphState | null>(() => {
    if (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz") {
      return contentBox.state;
    }
    return null;
  });

  // Synchronize dynamic graph state when page index changes
  useEffect(() => {
    if (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz") {
      setGraphState(contentBox.state);
    } else {
      setGraphState(null);
    }
    setSelectedOptionId(null);
  }, [currentPageIndex]); // Dependent on index change

  // Handle node drag positioning with explicit types
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

  // Handle node tap/click selection and auto-cleanup of stray edges
  const handleNodeClick = (nodeId: string) => {
    setGraphState((prev: GraphState | null) => {
      if (!prev) return null;

      const isHighlighted = prev.highlightedNodes.includes(nodeId);

      // Toggle target node
      const nextNodes = isHighlighted
        ? prev.highlightedNodes.filter((id: string) => id !== nodeId)
        : [...prev.highlightedNodes, nodeId];

      // Filter out edges whose source OR target is no longer in nextNodes
      const nextNodesSet = new Set(nextNodes);
      const validEdges = prev.highlightedEdges.filter((edgeId: string) => {
        const edge = prev.edges.find((e) => e.id === edgeId);
        if (!edge) return false;
        return nextNodesSet.has(edge.source) && nextNodesSet.has(edge.target);
      });

      const totalCount = nextNodes.length + validEdges.length;
      playNoteSound(totalCount); // Plays /notes/{totalCount}.mp3

      return {
        ...prev,
        highlightedNodes: nextNodes,
        highlightedEdges: validEdges,
      };
    });
  };

  // Handle edge tap/click selection with explicit types
  const handleEdgeClick = (edgeId: string) => {
    setGraphState((prev: GraphState | null) => {
      if (!prev) return null;
      const isHighlighted = prev.highlightedEdges.includes(edgeId);
      const nextEdges = isHighlighted
        ? prev.highlightedEdges.filter((id: string) => id !== edgeId)
        : [...prev.highlightedEdges, edgeId];

      const totalCount = prev.highlightedNodes.length + nextEdges.length;
      playNoteSound(totalCount); // Plays /notes/{totalCount}.mp3[cite: 1]

      return {
        ...prev,
        highlightedEdges: nextEdges,
      };
    });
  };

  // Reset graph back to initial JSON state
  const handleReset = () => {
    if (contentBox.boxType === "graph" || contentBox.boxType === "graph-quiz") {
      setGraphState(contentBox.state);
    }
  };

  return (
    <div className="w-full h-screen bg-slate-900 text-slate-100 flex flex-col p-0 m-0 overflow-hidden">
      <div className="w-full h-full bg-slate-900 border-0 p-6 flex flex-col justify-between relative overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-4 shrink-0">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Sparkles className="w-4 h-4 text-purple-400 fill-purple-400" />
            <span>{lessonData.meta.module}</span>
          </div>
          <span className="uppercase tracking-widest text-[10px] text-slate-400 font-medium">
            LESSON {lessonData.meta.lessonNumber}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <button
            disabled={currentPageIndex === 0}
            onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
            className="text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 bg-slate-800 h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-purple-500 h-full transition-all duration-300"
              style={{
                width: `${((currentPageIndex + 1) / totalPages) * 100}%`,
              }}
            />
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {currentPageIndex + 1} · {currentPageIndex + 1}/{totalPages}
          </span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-start gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase">
              {lessonData.meta.category}
            </span>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">
              {currentPage.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {currentPage.subtext}
            </p>
          </div>

          {/* Type-safe content box rendering */}
          {contentBox.boxType === "text" && (
            <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-lg flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-purple-300">
                {contentBox.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {contentBox.text}
              </p>
            </div>
          )}

          {contentBox.boxType === "graph" && graphState && (
            <div className="flex flex-col gap-3">
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
              {contentBox.text && (
                <p className="text-xs text-slate-400 text-center font-medium">
                  {contentBox.text}
                </p>
              )}
            </div>
          )}

          {contentBox.boxType === "graph-quiz" && graphState && (
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

              <div className="flex flex-col gap-3 mt-1">
                {contentBox.question && (
                  <h3 className="text-sm font-bold text-slate-100 px-1">
                    {contentBox.question}
                  </h3>
                )}

                <div className="flex flex-col gap-2.5">
                  {contentBox.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedOptionId(option.id)}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${isSelected
                          ? "bg-[#27253a] border-purple-500 text-slate-100 shadow-md shadow-purple-500/10"
                          : "bg-[#181924] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-[#1d1e2b]"
                          }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected
                            ? "border-purple-400 bg-purple-500/20"
                            : "border-slate-600"
                            }`}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Conditional Extra Box */}
          {currentPage.extraBox && (
            <div className="bg-[#1e1f2b] border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-2 mt-auto shadow-lg">
              <span className="text-[10px] font-bold tracking-wider text-purple-300 uppercase">
                {currentPage.extraBox.title}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {currentPage.extraBox.text}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            if (currentPageIndex < totalPages - 1) {
              setCurrentPageIndex((prev) => prev + 1);
            }
          }}
          className="w-full mt-6 bg-purple-600 hover:bg-purple-500 text-slate-100 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-purple-600/20 shrink-0"
        >
          <span>{currentPage.buttonLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default App;
