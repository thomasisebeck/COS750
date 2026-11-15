import type { GraphNode } from "./LiveGraph";

export interface EdgeDrawing { d: string; labelX: number; labelY: number; curved: boolean; }

/** Route an edge around any unrelated vertex lying on its straight segment. */
export function edgeDrawing(source: GraphNode, target: GraphNode, otherNodes: GraphNode[], clearance = 27): EdgeDrawing {
  const dx = target.x - source.x, dy = target.y - source.y;
  const length = Math.hypot(dx,dy);
  const straight = {d:`M ${source.x} ${source.y} L ${target.x} ${target.y}`,
    labelX:(source.x+target.x)/2,labelY:(source.y+target.y)/2,curved:false};
  if (length < 1) return straight;
  const blockers = otherNodes.filter(node=>{
    if (node.id === source.id || node.id === target.id) return false;
    const projection = ((node.x-source.x)*dx+(node.y-source.y)*dy)/(length*length);
    if (projection <= 0.04 || projection >= 0.96) return false;
    const cross = Math.abs((node.x-source.x)*dy - (node.y-source.y)*dx)/length;
    return cross < clearance;
  });
  if (!blockers.length) return straight;
  const nx = -dy/length, ny = dx/length;
  // Deterministic side, with a sufficiently large offset to clear a node
  // even when another vertex is directly at the midpoint of this edge.
  const offset = 105;
  const cx = (source.x + target.x)/2 + nx*offset;
  const cy = (source.y + target.y)/2 + ny*offset;
  return {d:`M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`,
    labelX:(source.x+2*cx+target.x)/4,
    labelY:(source.y+2*cy+target.y)/4,curved:true};
}
