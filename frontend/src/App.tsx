import { useState, useEffect } from "react";
import "./App.css";
import { Sparkles, ChevronLeft, ArrowRight } from "lucide-react";
import { LiveGraph } from "./components/LiveGraph";
import lessonData from "./lessons/lesson-1.json";
import { playNoteSound } from "./helpers";

function App() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const currentPage = lessonData.pages[currentPageIndex];
  const totalPages = lessonData.pages.length;

  // Track dynamic graph state for graph-type content boxes
  const [graphState, setGraphState] = useState(
    currentPage.contentBox?.boxType === "graph"
      ? currentPage.contentBox.state
      : null,
  );

  // Update local graph state whenever the page changes
  useEffect(() => {
    if (currentPage.contentBox?.boxType === "graph") {
      setGraphState(currentPage.contentBox.state);
    }
  }, [currentPageIndex]);

  // Handle node drag positioning
  const handleNodeMove = (nodeId, x, y) => {
    setGraphState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === nodeId ? { ...node, x, y } : node,
      ),
    }));
  };

  // Handle node tap/click selection
  const handleNodeClick = (nodeId) => {
    setGraphState((prev) => {
      const isHighlighted = prev.highlightedNodes.includes(nodeId);
      const nextNodes = isHighlighted
        ? prev.highlightedNodes.filter((id) => id !== nodeId)
        : [...prev.highlightedNodes, nodeId];

      const totalCount = nextNodes.length + prev.highlightedEdges.length;
      playNoteSound(totalCount); // Plays /notes/{totalCount}.mp3[cite: 1]

      return {
        ...prev,
        highlightedNodes: nextNodes,
      };
    });
  };

  // Reset graph back to initial JSON state
  const handleReset = () => {
    if (currentPage.contentBox?.boxType === "graph") {
      setGraphState(currentPage.contentBox.state);
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

          {/* Render Text Content Box */}
          {currentPage.contentBox.boxType === "text" && (
            <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-lg flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-purple-300">
                {currentPage.contentBox.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {currentPage.contentBox.text}
              </p>
            </div>
          )}

          {/* Render Graph Content Box */}
          {currentPage.contentBox.boxType === "graph" && graphState && (
            <div className="flex flex-col gap-3">
              <LiveGraph
                nodes={graphState.nodes}
                edges={graphState.edges}
                highlightedNodeIds={graphState.highlightedNodes}
                highlightedEdgeIds={graphState.highlightedEdges}
                onNodeMove={handleNodeMove}
                onNodeClick={handleNodeClick}
                onReset={handleReset}
              />
              {currentPage.contentBox.text && (
                <p className="text-xs text-slate-400 text-center font-medium">
                  {currentPage.contentBox.text}
                </p>
              )}
            </div>
          )}

          {/* Extra Box */}
          {currentPage.extraBox && (
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-lg flex flex-col gap-1 mt-auto">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {currentPage.extraBox.title}
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
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
