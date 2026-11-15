import React, { useId, useRef, useState } from "react";
import { Activity, Grip, RotateCcw } from "lucide-react";
import { edgeDrawing } from "./graphGeometry";

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

/**
 * Shared graph for all seven lessons. Keeps the existing prop contract,
 * with touch-friendly dragging, keyboard selection, labelled weights and
 * non-colour indicators for highlighted paths.
 */
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
  showCounts = false,
  mustSelectPath = true,
  isDirected = true,
  readOnly = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const id = useId().replace(/:/g, "");
  // All lessons render in one 600×400 visual coordinate system. Smaller legacy
  // graph datasets are scaled, not drawn with oversized circles or labels.
  const renderWidth = 600;
  const renderHeight = 400;
  const renderNodes = nodes.map(node => ({...node,x:node.x * renderWidth / width,y:node.y * renderHeight / height}));
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const nodeMap = new Map(renderNodes.map((node) => [node.id, node]));

  const getSvgCoordinates = (event: React.PointerEvent) => {
    const ctm = svgRef.current?.getScreenCTM?.();
    if (!ctm) return null;
    return {
      x: (event.clientX - ctm.e) / ctm.a,
      y: (event.clientY - ctm.f) / ctm.d,
    };
  };

  const handlePointerDown = (event: React.PointerEvent, node: GraphNode) => {
    if (readOnly || !onNodeMove) return;
    event.stopPropagation();
    const coords = getSvgCoordinates(event);
    if (!coords) return;
    setDraggingNodeId(node.id);
    hasMovedRef.current = false;
    dragOffsetRef.current = { x: coords.x - node.x, y: coords.y - node.y };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingNodeId || !onNodeMove) return;
    const coords = getSvgCoordinates(event);
    if (!coords) return;
    const x = Math.max(28, Math.min(renderWidth - 28, coords.x - dragOffsetRef.current.x));
    const y = Math.max(28, Math.min(renderHeight - 28, coords.y - dragOffsetRef.current.y));
    const node = nodeMap.get(draggingNodeId);
    if (node && Math.hypot(x - node.x, y - node.y) > 3) hasMovedRef.current = true;
    onNodeMove(draggingNodeId, x * width / renderWidth, y * height / renderHeight);
  };

  const handleNodeSelect = (nodeId: string) => {
    if (readOnly) return;
    const lastNode = highlightedNodeIds[highlightedNodeIds.length - 1];
    if (mustSelectPath && lastNode && lastNode !== nodeId && !highlightedNodeIds.includes(nodeId)) {
      const connectingEdge = edges.find((edge) =>
        (edge.source === lastNode && edge.target === nodeId) ||
        (!isDirected && edge.target === lastNode && edge.source === nodeId),
      );
      if (connectingEdge && onEdgeClick && !highlightedEdgeIds.includes(connectingEdge.id)) {
        onEdgeClick(connectingEdge.id);
      }
    }
    onNodeClick?.(nodeId);
  };

  const accessibleDescription = `${isDirected ? "Directed" : "Undirected"} graph with ${nodes.length} vertices and ${edges.length} edges. ` +
    edges.map((edge) => `${edge.source} ${isDirected ? "to" : "connected to"} ${edge.target}${edge.label ? `, weight ${edge.label}` : ""}`).join("; ");

  return <div className="pf-live-graph">
    <header className="pf-live-header">
      <div className="pf-live-heading"><span className="pf-live-activity"><Activity size={16} aria-hidden="true" /></span><div><strong>{readOnly ? "Assessment graph" : "Interactive graph"}</strong><small>{readOnly ? "Study the connections and their weights" : "Select or drag a vertex to explore"}</small></div></div>
      <div className="pf-live-actions">
        {showCounts && <span className="pf-live-counts">{nodes.length} vertices · {edges.length} edges</span>}
        {onReset && !readOnly && <button type="button" onClick={onReset} className="pf-live-reset" aria-label="Reset graph positions and selections"><RotateCcw size={14} aria-hidden="true" /><span>Reset</span></button>}
      </div>
    </header>
    <svg
      ref={svgRef}
      role="group"
      aria-label={accessibleDescription}
      viewBox={`0 0 ${renderWidth} ${renderHeight}`}
      className="pf-graph-svg"
      onPointerMove={handlePointerMove}
      onPointerUp={() => setDraggingNodeId(null)}
      onPointerCancel={() => setDraggingNodeId(null)}
      onPointerLeave={() => setDraggingNodeId(null)}
    >
      <defs>
        <pattern id={`${id}-dots`} width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#d6dff0" /></pattern>
        <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="17" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#8d9cbe" /></marker>
        <marker id={`${id}-selected-arrow`} viewBox="0 0 10 10" refX="17" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#5d4bd0" /></marker>
      </defs>
      <rect width={renderWidth} height={renderHeight} rx="16" fill="#f7f9ff" />
      <rect width={renderWidth} height={renderHeight} rx="16" fill={`url(#${id}-dots)`} />
      {edges.map((edge) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) return null;
        const highlighted = highlightedEdgeIds.includes(edge.id);
        const drawing = edgeDrawing(source, target, renderNodes);
        const midX = drawing.labelX;
        const midY = drawing.labelY;
        const interactive = !readOnly && Boolean(onEdgeClick);
        return <g
          key={edge.id}
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : undefined}
          aria-label={`${edge.source} ${isDirected ? "to" : "to or from"} ${edge.target}${edge.label ? `, cost ${edge.label}` : ""}${highlighted ? ", selected" : ""}`}
          aria-pressed={interactive ? highlighted : undefined}
          onClick={interactive ? () => onEdgeClick?.(edge.id) : undefined}
          onKeyDown={interactive ? (event) => {if (event.key === "Enter" || event.key === " ") {event.preventDefault();onEdgeClick?.(edge.id);}} : undefined}
          className={interactive ? "pf-graph-edge interactive" : "pf-graph-edge"}
        >
          <path d={drawing.d} fill="none" stroke={highlighted ? "#5d4bd0" : "#a5afc8"} strokeWidth={highlighted ? 5 : 3} strokeDasharray={highlighted ? "9 5" : undefined} strokeLinecap="round" markerEnd={isDirected ? `url(#${id}-${highlighted ? "selected-arrow" : "arrow"})` : undefined} />
          <path d={drawing.d} fill="none" stroke="transparent" strokeWidth={22} />
          {edge.label && <g className="pf-edge-weight"><rect x={midX - 14} y={midY - 12} width="28" height="23" rx="8" fill={highlighted ? "#eeeaff" : "#fff"} stroke={highlighted ? "#6b58d4" : "#c9d1e3"} strokeWidth="1.5"/><text x={midX} y={midY + 4} fontSize="12" textAnchor="middle" fill={highlighted ? "#4030aa" : "#354362"} fontWeight="800" className="pointer-events-none">{edge.label}</text></g>}
        </g>;
      })}
      {renderNodes.map((node) => {
        const highlighted = highlightedNodeIds.includes(node.id);
        const interactive = !readOnly && Boolean(onNodeClick);
        const shortLabel = node.label.length <= 2;
        return <g
          key={node.id}
          transform={`translate(${node.x}, ${node.y})`}
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : undefined}
          aria-label={`Vertex ${node.label}${highlighted ? ", selected" : ""}`}
          aria-pressed={interactive ? highlighted : undefined}
          onPointerDown={interactive ? (event) => handlePointerDown(event, node) : undefined}
          onClick={interactive ? () => {if (!hasMovedRef.current) handleNodeSelect(node.id); else hasMovedRef.current = false;} : undefined}
          onKeyDown={interactive ? (event) => {if (event.key === "Enter" || event.key === " ") {event.preventDefault();handleNodeSelect(node.id);}} : undefined}
          className={interactive ? "pf-graph-node interactive" : "pf-graph-node"}
        >
          {highlighted && <circle r="25" fill="none" stroke="#6554db" strokeWidth="2.5" strokeDasharray="5 4" />}
          <circle r="19" fill={highlighted ? "#5e4ed2" : (node.color ?? "#fff")} stroke={highlighted ? "#4130b0" : "#6e7da8"} strokeWidth="2.6" />
          <text y={shortLabel ? 5 : 34} fill={shortLabel ? (highlighted ? "#fff" : "#2b3b64") : "#283653"} fontWeight="850" fontSize={shortLabel ? "15" : "13"} textAnchor="middle" className="pf-graph-node-label">{node.label}</text>
        </g>;
      })}
    </svg>
    {!readOnly && <p className="pf-live-help"><Grip size={14} aria-hidden="true"/>Click or use Tab + Enter to select. Drag with a mouse or touch to reposition.</p>}
  </div>;
};
