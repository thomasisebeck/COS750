import type { GraphState } from "../types/lesson";

/** Adjacent means one *drawn* edge away, in either direction for an undirected graph. */
export function adjacentVertices(state: GraphState, vertexId: string): string[] {
  const neighbours = new Set<string>();
  for (const edge of state.edges) {
    if (edge.source === vertexId) neighbours.add(edge.target);
    if (edge.target === vertexId) neighbours.add(edge.source);
  }
  return state.nodes.map(node => node.id).filter(id => neighbours.has(id));
}

/** Return edges that visually pass through a vertex which is not an endpoint.
 * The interactive graph has a node radius of ~19 units; allow generous clearance.
 */
export function edgesThroughUnrelatedVertices(state: GraphState, clearance = 25): string[] {
  const points = new Map(state.nodes.map(node=>[node.id,node]));
  return state.edges.flatMap(edge=>{
    const source=points.get(edge.source),target=points.get(edge.target);
    if (!source || !target) return [];
    const dx=target.x-source.x,dy=target.y-source.y;
    const denominator=dx*dx+dy*dy;
    if (!denominator) return [edge.id];
    const crosses=state.nodes.some(node=>{
      if (node.id===edge.source || node.id===edge.target) return false;
      const t=((node.x-source.x)*dx+(node.y-source.y)*dy)/denominator;
      if (t<=0 || t>=1) return false;
      const distance=Math.hypot(node.x-(source.x+t*dx),node.y-(source.y+t*dy));
      return distance<clearance;
    });
    return crosses?[edge.id]:[];
  });
}
