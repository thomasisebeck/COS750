import type { GraphEdge, GraphNode } from "./LiveGraph";

interface WeightedGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightedNodeIds?: string[];
  className?: string;
}

/**
 * A read-only, accessible graph diagram designed for short worked examples.
 * Unlike LiveGraph's interactive sandbox, edge weights and node labels stay
 * fixed and legible while the diagram scales to mobile screens.
 */
export function WeightedGraph({
  nodes,
  edges,
  highlightedNodeIds = [],
  className = "",
}: WeightedGraphProps) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const description = `Undirected graph. ${edges
    .map((edge) => `${edge.source} to ${edge.target}: weight ${edge.label ?? "unknown"}`)
    .join("; ")}.`;

  return (
    <div className={`l3-graph ${className}`}>
      <svg
        viewBox="0 0 260 180"
        role="img"
        aria-label={description}
        className="l3-graph-svg"
      >
        {edges.map((edge) => {
          const source = nodeById.get(edge.source);
          const target = nodeById.get(edge.target);
          if (!source || !target) return null;

          const middleX = (source.x + target.x) / 2;
          const middleY = (source.y + target.y) / 2;
          // Keep weights clear of the vertical B–C edge and node circles.
          const offsetX = edge.source === "B" && edge.target === "C" ? 8 : 0;
          const offsetY = edge.source === "B" && edge.target === "C" ? 0 : -7;

          return (
            <g key={edge.id}>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="#9291a5"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {edge.label && (
                <text
                  x={middleX + offsetX}
                  y={middleY + offsetY}
                  fill="#ffd17e"
                  fontSize="10"
                  fontWeight="700"
                  dominantBaseline="central"
                  textAnchor="middle"
                  className="l3-edge-weight"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}
        {nodes.map((node) => {
          const active = highlightedNodeIds.includes(node.id);
          return (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="14"
                fill={active ? "#995cf6" : "#282934"}
                stroke={active ? "#c39aff" : "#b6b4c7"}
                strokeWidth="1.8"
              />
              <text
                x={node.x}
                y={node.y + 0.5}
                fill="#f7f5ff"
                fontSize="12"
                fontWeight="700"
                dominantBaseline="central"
                textAnchor="middle"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
export default function WeightedGraph({ active }: { active?: string }) {
  return <div className="graph-card"><svg viewBox="0 0 276 210" role="img" aria-label="Weighted graph: A–B 2, A–C 5, B–C 1, B–D 6, C–D 2">
    <path className="edges" d="M38 112L128 36L238 110L132 174L38 112 M128 36L132 174" />
    <g className="weights"><text x="76" y="73">2</text><text x="80" y="146">5</text><text x="121" y="105">1</text><text x="179" y="73">6</text><text x="183" y="145">2</text></g>
    {([{name:'A',x:38,y:112},{name:'B',x:128,y:36},{name:'C',x:132,y:174},{name:'D',x:238,y:110}]).map(({name,x,y}) => <g key={name} className={active === name ? 'vertex active' : 'vertex'}><circle cx={x} cy={y} r="16"/><text x={x} y={y} dy=".35em">{name}</text></g>)}
  </svg></div>
}

