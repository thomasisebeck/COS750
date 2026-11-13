import type { GraphEdge, GraphNode } from "./LiveGraph";

interface WeightedGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightedNodeIds?: string[];
  settledNodeIds?: string[];
  highlightedEdgeIds?: string[];
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
  settledNodeIds = [],
  highlightedEdgeIds = [],
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
          const offsetX = edge.source === "B" && edge.target === "C" ? 8 : 0;
          const offsetY = edge.source === "B" && edge.target === "C" ? 0 : -7;
          const isHighlighted = highlightedEdgeIds.includes(edge.id);

          return (
            <g key={edge.id}>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={isHighlighted ? "#2dd4bf" : "#9291a5"}
                strokeWidth={isHighlighted ? "3" : "2"}
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
          const settled = settledNodeIds.includes(node.id);

          return (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="14"
                fill={active ? "#995cf6" : settled ? "#0f292a" : "#282934"}
                stroke={active ? "#c39aff" : settled ? "#2dd4bf" : "#b6b4c7"}
                strokeWidth={active || settled ? "2.2" : "1.8"}
              />
              <text
                x={node.x}
                y={node.y + 0.5}
                fill={settled ? "#2dd4bf" : "#f7f5ff"}
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