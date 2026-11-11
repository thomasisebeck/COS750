import { useState } from "react";
import "./App.css";
import {
  LiveGraph,
  type GraphEdge,
  type GraphNode,
} from "./components/LiveGraph";

const INITIAL_NODES: GraphNode[] = [
  { id: "1", label: "Gateway", x: 100, y: 200 },
  { id: "2", label: "Auth Service", x: 300, y: 100 },
  { id: "3", label: "Database", x: 500, y: 200 },
  { id: "4", label: "Cache (Redis)", x: 300, y: 300 },
];

const INITIAL_EDGES: GraphEdge[] = [
  { id: "e1-2", source: "1", target: "2", label: "HTTPS" },
  { id: "e2-3", source: "2", target: "3", label: "SQL" },
  { id: "e1-4", source: "1", target: "4", label: "Read" },
  { id: "e4-3", source: "4", target: "3", label: "Sync" },
];

const INITIAL_HIGHLIGHTED_NODES = ["1"];

function App() {
  const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(INITIAL_EDGES);

  // Helper to find connecting edge IDs between consecutive nodes in the path sequence
  const getConnectingEdges = (path: string[], graphEdges: GraphEdge[]) => {
    const activeEdgeIds: string[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];

      const matchingEdge = graphEdges.find(
        (edge) =>
          (edge.source === u && edge.target === v) ||
          (edge.source === v && edge.target === u),
      );

      if (matchingEdge) {
        activeEdgeIds.push(matchingEdge.id);
      }
    }
    return activeEdgeIds;
  };

  const [highlightedNodes, setHighlightedNodes] = useState<string[]>(
    INITIAL_HIGHLIGHTED_NODES,
  );
  const [highlightedEdges, setHighlightedEdges] = useState<string[]>(() =>
    getConnectingEdges(INITIAL_HIGHLIGHTED_NODES, INITIAL_EDGES),
  );

  const playNote = (count: number) => {
    if (count >= 1 && count <= 18) {
      const audio = new Audio(`/notes/${count}.mp3`);
      audio.currentTime = 0;
      audio.play().catch((err) => console.error("Audio playback error:", err));
    }
  };

  const handleNodeClick = (nodeId: string) => {
    console.log(`Node clicked in App: ${nodeId}`);

    setHighlightedNodes((prev) => {
      const existingIndex = prev.indexOf(nodeId);
      let nextHighlighted: string[];

      if (existingIndex !== -1) {
        // Backtrack: Keep the path up to and including the clicked node
        nextHighlighted = prev.slice(0, existingIndex + 1);
      } else {
        // Add new node to the path sequence
        nextHighlighted = [...prev, nodeId];
      }

      // Update highlighted edges based on consecutive nodes in the new path
      setHighlightedEdges(getConnectingEdges(nextHighlighted, edges));

      // Play note for the updated selected node count
      playNote(nextHighlighted.length);

      return nextHighlighted;
    });
  };

  const handleNodeMove = (nodeId: string, x: number, y: number) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === nodeId ? { ...node, x, y } : node)),
    );
  };

  const handleReset = () => {
    setNodes(INITIAL_NODES);
    setEdges(INITIAL_EDGES);
    setHighlightedNodes(INITIAL_HIGHLIGHTED_NODES);
    const initialEdges = getConnectingEdges(
      INITIAL_HIGHLIGHTED_NODES,
      INITIAL_EDGES,
    );
    setHighlightedEdges(initialEdges);
    playNote(INITIAL_HIGHLIGHTED_NODES.length);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center gap-6">
      <LiveGraph
        nodes={nodes}
        edges={edges}
        highlightedNodeIds={highlightedNodes}
        highlightedEdgeIds={highlightedEdges}
        onNodeClick={handleNodeClick}
        onNodeMove={handleNodeMove}
        onReset={handleReset}
        width={650}
        height={350}
      />
    </div>
  );
}

export default App;
