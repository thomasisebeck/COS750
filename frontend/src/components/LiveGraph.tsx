import React, { useState, useRef } from "react";
import { Circle, Activity } from "lucide-react";

export const INITIAL_NODES: GraphNode[] = [
  { id: "1", label: "Gateway", x: 100, y: 200 },
  { id: "2", label: "Auth Service", x: 300, y: 100 },
  { id: "3", label: "Database", x: 500, y: 200 },
  { id: "4", label: "Cache (Redis)", x: 300, y: 300 },
];

export const INITIAL_EDGES: GraphEdge[] = [
  { id: "e1-2", source: "1", target: "2", label: "HTTPS" },
  { id: "e2-3", source: "2", target: "3", label: "SQL" },
  { id: "e1-4", source: "1", target: "4", label: "Read" },
  { id: "e4-3", source: "4", target: "3", label: "Sync" },
];

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color?: string;
}

export interface GraphEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  label?: string;
}

interface LiveGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightedNodeIds?: string[];
  highlightedEdgeIds?: string[];
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  onNodeMove?: (nodeId: string, x: number, y: number) => void;
  width?: number;
  height?: number;
}

export const LiveGraph: React.FC<LiveGraphProps> = ({
  nodes,
  edges,
  highlightedNodeIds = [],
  highlightedEdgeIds = [],
  onNodeClick,
  onEdgeClick,
  onNodeMove,
  width = 600,
  height = 400,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Track whether the mouse has actually moved during the current press
  const hasMovedRef = useRef<boolean>(false);

  // Quick lookup map for node coordinates
  const nodeMap = new Map<string, GraphNode>(nodes.map((n) => [n.id, n]));

  // Handle start of node drag
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    hasMovedRef.current = false; // Reset movement tracker on fresh click
  };

  // Handle node movement across the SVG canvas
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingNodeId || !svgRef.current) return;

    // Mark that movement has occurred
    hasMovedRef.current = true;

    const svgRect = svgRef.current.getBoundingClientRect();
    const x = Math.max(20, Math.min(width - 20, e.clientX - svgRect.left));
    const y = Math.max(20, Math.min(height - 20, e.clientY - svgRect.top));

    if (onNodeMove) {
      onNodeMove(draggingNodeId, x, y);
    }
  };

  // End dragging session
  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  return (
    <div className="relative border border-slate-700 bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center p-4">
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div className="flex items-center gap-2 text-slate-200 font-medium text-sm">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Sandbox</span>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
          {nodes.length} Nodes | {edges.length} Edges
        </span>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="bg-slate-950/50 rounded-lg border border-slate-800/80 cursor-crosshair select-none"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="20"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
          <marker
            id="arrow-highlighted"
            viewBox="0 0 10 10"
            refX="20"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
          </marker>
        </defs>

        {/* Render Edges */}
        {edges.map((edge) => {
          const sourceNode = nodeMap.get(edge.source);
          const targetNode = nodeMap.get(edge.target);

          if (!sourceNode || !targetNode) return null;

          const isHighlighted = highlightedEdgeIds.includes(edge.id);
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;

          return (
            <g
              key={edge.id}
              onClick={() => onEdgeClick && onEdgeClick(edge.id)}
              className="cursor-pointer group"
            >
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={isHighlighted ? "#38bdf8" : "#475569"}
                strokeWidth={isHighlighted ? 3 : 2}
                className="transition-colors duration-300 group-hover:stroke-indigo-400"
                markerEnd={
                  isHighlighted ? "url(#arrow-highlighted)" : "url(#arrow)"
                }
              />
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="transparent"
                strokeWidth={12}
              />
              {edge.label && (
                <text
                  x={midX}
                  y={midY - 8}
                  fill={isHighlighted ? "#7dd3fc" : "#94a3b8"}
                  fontSize="10"
                  textAnchor="middle"
                  className="pointer-events-none font-sans"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Render Nodes */}
        {nodes.map((node) => {
          const isHighlighted = highlightedNodeIds.includes(node.id);

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={() => {
                // Only trigger click if the mouse didn't move during the interaction
                if (!hasMovedRef.current && onNodeClick) {
                  onNodeClick(node.id);
                }
              }}
              className="cursor-grab active:cursor-grabbing group transition-transform duration-75"
            >
              {isHighlighted && (
                <circle
                  r={22}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  className="animate-spin"
                />
              )}

              <circle
                r={16}
                fill={node.color || (isHighlighted ? "#0284c7" : "#1e293b")}
                stroke={isHighlighted ? "#38bdf8" : "#64748b"}
                strokeWidth={isHighlighted ? 3 : 2}
                className="transition-colors duration-200 group-hover:fill-indigo-600 group-hover:stroke-indigo-400 shadow-md"
              />

              <text
                y={28}
                fill="#f1f5f9"
                fontSize="11"
                fontWeight="500"
                textAnchor="middle"
                className="pointer-events-none select-none font-sans drop-shadow"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
