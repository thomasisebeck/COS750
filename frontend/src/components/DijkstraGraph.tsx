import { LESSON4_EDGES, type VertexId } from "../algorithms/dijkstra";

interface DijkstraGraphProps {
  activeVertex?: VertexId | null;
  settledVertices?: readonly VertexId[];
  highlightedEdges?: readonly string[];
  routeVertices?: readonly VertexId[];
}

const POSITIONS: Record<VertexId, { x: number; y: number }> = {
  A: { x: 35, y: 102 },
  B: { x: 130, y: 29 },
  C: { x: 130, y: 172 },
  D: { x: 225, y: 102 },
};

const WEIGHT_POSITIONS: Record<string, { x: number; y: number }> = {
  AB: { x: 86, y: 60 },
  AC: { x: 86, y: 145 },
  BC: { x: 140, y: 101 },
  BD: { x: 182, y: 60 },
  CD: { x: 183, y: 144 },
};

/** Read-only graph for the Dijkstra walkthrough, with an accessible layout & color scheme. */
export function DijkstraGraph({
  activeVertex = null,
  settledVertices = [],
  highlightedEdges = [],
  routeVertices = [],
}: DijkstraGraphProps) {
  return (
    <div className="l4-graph-panel">
      <svg
        className="l4-graph-svg"
        viewBox="0 0 260 200"
        role="img"
        aria-label={`Undirected weighted graph. A–B costs 4; A–C costs 2; B–C costs 1; B–D costs 3; C–D costs 6. ${activeVertex ? `${activeVertex} is the current vertex.` : ""}`}
      >
        {LESSON4_EDGES.map((edge) => {
          const from = POSITIONS[edge.source];
          const to = POSITIONS[edge.target];
          const label = WEIGHT_POSITIONS[edge.id];
          const highlighted = highlightedEdges.includes(edge.id);
          return (
            <g key={edge.id}>
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                // Use a high-contrast teal/cyan or vibrant stroke for highlighted paths
                stroke={highlighted ? "#2dd4bf" : "#9796aa"}
                strokeWidth={highlighted ? 3.4 : 2}
                strokeLinecap="round"
              />
              <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle"
                className="l4-edge-label">{edge.weight}</text>
            </g>
          );
        })}
        {(["A", "B", "C", "D"] as const).map((vertex) => {
          const { x, y } = POSITIONS[vertex];
          const active = activeVertex === vertex;
          const onRoute = routeVertices.includes(vertex);
          const settled = settledVertices.includes(vertex);
          return (
            <g key={vertex}>
              <circle cx={x} cy={y} r="15"
                // Active = Purple, Settled = Accessible Teal, Default = Dark Slate
                fill={active ? "#9c60f5" : settled ? "#0f292a" : "#282934"}
                stroke={active ? "#c69aff" : settled ? "#2dd4bf" : onRoute ? "#b3a5c8" : "#aaa8bc"}
                strokeWidth={settled || active ? "2.5" : "1.9"} 
              />
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                className="l4-node-label"
                fill={settled ? "#2dd4bf" : "#ffffff"}
              >{vertex}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}