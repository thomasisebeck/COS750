import { LESSON4_EDGES, type VertexId } from "../algorithms/dijkstra";
import { LiveGraph, type GraphNode } from "./LiveGraph";

interface DijkstraGraphProps {
  activeVertex?: VertexId | null;
  settledVertices?: readonly VertexId[];
  highlightedEdges?: readonly string[];
  routeVertices?: readonly VertexId[];
}
const nodes: GraphNode[] = [
  {id:"A",label:"A",x:35,y:102}, {id:"B",label:"B",x:130,y:29},
  {id:"C",label:"C",x:130,y:172}, {id:"D",label:"D",x:225,y:102},
];

/** Compatibility adapter for the original walkthrough graph. */
export function DijkstraGraph({activeVertex=null,settledVertices=[],highlightedEdges=[],routeVertices=[]}:DijkstraGraphProps) {
  return <LiveGraph nodes={nodes} edges={LESSON4_EDGES.map(edge => ({
    id:edge.id,source:edge.source,target:edge.target,label:String(edge.weight),
  }))} width={260} height={200} isDirected={false} readOnly
    highlightedNodeIds={[...new Set([...(activeVertex?[activeVertex]:[]),...settledVertices,...routeVertices])]}
    highlightedEdgeIds={[...highlightedEdges]}/>;
}
