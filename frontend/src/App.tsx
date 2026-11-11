import { useState } from "react";
import "./App.css";
import {
  INITIAL_EDGES,
  INITIAL_NODES,
  LiveGraph,
  type GraphEdge,
  type GraphNode,
} from "./components/LiveGraph";

function App() {
  const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(INITIAL_EDGES);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>(["1"]);
  const [highlightedEdges, setHighlightedEdges] = useState<string[]>([]);

  const playNote = (count: number) => {
    if (count >= 1 && count <= 18) {
      const audio = new Audio(`/notes/${count}.mp3`);
      audio.currentTime = 0;
      audio.play().catch((err) => console.error("Audio playback error:", err));
    }
  };

  // Helper to find connecting edge IDs between consecutive nodes in the path sequence
  const getConnectingEdges = (path: string[], graphEdges: GraphEdge[]) => {
    const activeEdgeIds: string[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];

      // Find an edge connecting consecutive nodes in either direction
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center gap-6">
      <LiveGraph
        nodes={nodes}
        edges={edges}
        highlightedNodeIds={highlightedNodes}
        highlightedEdgeIds={highlightedEdges}
        onNodeClick={handleNodeClick}
        onNodeMove={handleNodeMove}
        width={650}
        height={350}
      />
    </div>
  );
}

export default App;
