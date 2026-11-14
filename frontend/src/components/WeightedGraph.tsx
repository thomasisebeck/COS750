import { LiveGraph, type GraphNode, type GraphEdge } from "./LiveGraph";

interface WeightedGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightedNodeIds?: string[];
  settledNodeIds?: string[];
  highlightedEdgeIds?: string[];
  className?: string;
}

/** Compatibility adapter: every graph now uses Lesson 1's LiveGraph visual system. */
export function WeightedGraph({ nodes, edges, highlightedNodeIds = [], settledNodeIds = [], highlightedEdgeIds = [], className = "" }: WeightedGraphProps) {
  return <div className={className}><LiveGraph
    nodes={nodes} edges={edges} width={260} height={180} readOnly isDirected={false}
    highlightedNodeIds={[...new Set([...highlightedNodeIds,...settledNodeIds])]} highlightedEdgeIds={highlightedEdgeIds} />
  </div>;
}
