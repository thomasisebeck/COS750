import React, { useState, useRef } from "react";
import { Activity, RotateCcw } from "lucide-react";

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
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
  onReset?: () => void;
  width?: number;
  height?: number;
  showCounts?: boolean;
  mustSelectPath?: boolean;
  isDirected?: boolean;
  readOnly?: boolean;
}

export const LiveGraph: React.FC<LiveGraphProps> = ({
  nodes,
  edges,
  highlightedNodeIds = [],
  highlightedEdgeIds = [],
  onNodeClick,
  onEdgeClick,
  onNodeMove,
  onReset,
  width = 600,
  height = 400,
  showCounts,
  mustSelectPath = true,
  isDirected = true,
  readOnly = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Offset between cursor and center of the dragged node
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Track whether mouse moved significantly during press to suppress click events
  const hasMovedRef = useRef<boolean>(false);

  // Quick lookup map for node coordinates
  const nodeMap = new Map<string, GraphNode>(nodes.map((n) => [n.id, n]));

  // Helper to convert screen coordinates to SVG viewBox coordinates
  const getSvgCoordinates = (e: React.MouseEvent) => {
    if (!svgRef.current) return null;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return null;

    return {
      x: (e.clientX - ctm.e) / ctm.a,
      y: (e.clientY - ctm.f) / ctm.d,
    };
  };

  // Handle start of node drag
  const handleMouseDown = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    const coords = getSvgCoordinates(e);
    if (!coords) return;

    setDraggingNodeId(node.id);
    hasMovedRef.current = false;

    // Save exact offset between click position and node center
    dragOffsetRef.current = {
      x: coords.x - node.x,
      y: coords.y - node.y,
    };
  };

  // Handle node movement across SVG space
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingNodeId || !svgRef.current) return;

    const coords = getSvgCoordinates(e);
    if (!coords) return;

    // Apply offset compensation
    const rawX = coords.x - dragOffsetRef.current.x;
    const rawY = coords.y - dragOffsetRef.current.y;

    // Constrain within viewBox bounds padding
    const x = Math.max(25, Math.min(width - 25, rawX));
    const y = Math.max(25, Math.min(height - 25, rawY));

    // Threshold movement to avoid treating tiny jitters as drags
    const currentNode = nodeMap.get(draggingNodeId);
    if (currentNode) {
      const dist = Math.hypot(x - currentNode.x, y - currentNode.y);
      if (dist > 3) {
        hasMovedRef.current = true;
      }
    }

    if (onNodeMove) {
      onNodeMove(draggingNodeId, x, y);
    }
  };

  // End dragging session
  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Node selection & auto-edge path highlighting logic
  const handleNodeSelect = (nodeId: string) => {
    const isAlreadyHighlighted = highlightedNodeIds.includes(nodeId);

    const prevNodeId =
      highlightedNodeIds.length > 0
        ? highlightedNodeIds[highlightedNodeIds.length - 1]
        : null;

    if (mustSelectPath && prevNodeId && !isAlreadyHighlighted) {
      const connectingEdge = edges.find(
        (edge) =>
          (edge.source === prevNodeId && edge.target === nodeId) ||
          (edge.source === nodeId && edge.target === prevNodeId),
      );

      if (
        connectingEdge &&
        onEdgeClick &&
        !highlightedEdgeIds.includes(connectingEdge.id)
      ) {
        onEdgeClick(connectingEdge.id);
      }
    }

    if (onNodeClick) {
      onNodeClick(nodeId);
    }
  };

  return (
    <div className="relative border border-slate-700 bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center p-4">
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div className="flex items-center gap-2 text-slate-200 font-medium text-sm">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>{readOnly ? "Assessment graph" : "Interactive Sandbox"}</span>
        </div>
        <div className="flex items-center gap-3">
          {showCounts && (
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
              {nodes.length} Vertices | {edges.length} Edges
            </span>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-auto max-h-[350px] bg-slate-950/50 rounded-lg border border-slate-800/80 cursor-crosshair select-none touch-none"
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
              onClick={() => {
                if (mustSelectPath && onEdgeClick) {
                  onEdgeClick(edge.id);
                }
              }}
              className={mustSelectPath ? "cursor-pointer group" : "group"}
            >
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={isHighlighted ? "#38bdf8" : "#475569"}
                strokeWidth={isHighlighted ? 3 : 2}
                className={
                  mustSelectPath
                    ? "transition-colors duration-300 group-hover:stroke-indigo-400"
                    : "transition-colors duration-300"
                }
                markerEnd={
                  isDirected
                    ? isHighlighted
                      ? "url(#arrow-highlighted)"
                      : "url(#arrow)"
                    : undefined
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
              onMouseDown={readOnly ? undefined : (e) => handleMouseDown(e, node)}
              onClick={() => {
                if (!readOnly && !hasMovedRef.current) {
                  handleNodeSelect(node.id);
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
                  className="animate-spin pointer-events-none"
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
