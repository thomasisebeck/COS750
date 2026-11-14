import { useState } from "react";
import { ArrowRight, Check, GitBranch, MapPinned, Network, Package, Waypoints } from "lucide-react";
import { LessonHeader } from "./LessonHeader";
import { ProgressBar } from "./ProgressBar";
import { PageTitle } from "./PageTitle";
import { LessonButton } from "./Buttons";
import { LiveGraph, type GraphEdge, type GraphNode } from "./LiveGraph";
import lesson0Raw from "../lessons/lesson-0.json";
import { playPianoNote } from "../helpers";
import "./lesson0.css";

interface Lesson0ExperienceProps { onExit: () => void; onComplete: () => void; }

const lesson0 = lesson0Raw;
const startingNodes: GraphNode[] = [
  { id: "A", label: "A", x: 58, y: 118 },
  { id: "B", label: "B", x: 168, y: 54 },
  { id: "C", label: "C", x: 168, y: 170 },
  { id: "D", label: "D", x: 288, y: 112 },
];
const startingEdges: GraphEdge[] = [
  { id: "AB", source: "A", target: "B", label: "4" },
  { id: "AC", source: "A", target: "C", label: "2" },
  { id: "BC", source: "B", target: "C", label: "1" },
  { id: "BD", source: "B", target: "D", label: "3" },
  { id: "CD", source: "C", target: "D", label: "6" },
];
const contextIcons = [MapPinned, Package, Network];
const otherTopics = [
  { name: "Trees & traversals", icon: GitBranch },
  { name: "Minimum spanning trees", icon: Network },
  { name: "Network flow", icon: Waypoints },
  { name: "Topological sorting", icon: ArrowRight },
];

/** A short, optional-feeling introduction: one example, one map, one sandbox. */
export function Lesson0Experience({ onExit, onComplete }: Lesson0ExperienceProps) {
  const [index, setIndex] = useState(0);
  const [contextIndex, setContextIndex] = useState(0);
  const [nodes, setNodes] = useState<GraphNode[]>(() => startingNodes.map((node) => ({ ...node })));
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const routes = [
    { id: "quick", name: "Through the café", stops: "A → C → B → D", cost: 6, edges: ["AC", "BC", "BD"], nodes: ["A", "C", "B", "D"] },
    { id: "north", name: "Past the library", stops: "A → B → D", cost: 7, edges: ["AB", "BD"], nodes: ["A", "B", "D"] },
    { id: "south", name: "Along the park", stops: "A → C → D", cost: 8, edges: ["AC", "CD"], nodes: ["A", "C", "D"] },
  ];
  const [routeIndex, setRouteIndex] = useState<number | null>(null);
  const page = lesson0.pages[index];
  const context = lesson0.contexts[contextIndex];
  const ContextIcon = contextIcons[contextIndex];

  function next() {
    if (index === lesson0.pages.length - 1) onComplete();
    else setIndex((previous) => previous + 1);
  }

  function back() {
    if (index === 0) onExit();
    else setIndex((previous) => previous - 1);
  }

  return (
    <div className="pf-screen pf-lesson-zero">
      <div className="pf-lesson-wrap">
        <LessonHeader lessonNumber="0" onMenuClick={onExit} />
        <ProgressBar currentIndex={index} total={lesson0.pages.length} onBack={back} />
        <main className="pf-zero-main" key={index}>
          <PageTitle category={page.category} title={page.title} subtext={page.subtext} />

          {page.type === "contexts" && <section className="pf-zero-contexts" aria-label="Real-life graphs">
            <div className="pf-context-selector" role="group" aria-label="Choose an example">
              {lesson0.contexts.map((item, i) => {
                const Icon = contextIcons[i];
                return <button type="button" key={item.id} aria-pressed={contextIndex === i} className={`pf-context-tab ${contextIndex === i ? "is-selected" : ""}`} onClick={() => {setContextIndex(i);playPianoNote(i);}}><Icon size={19} /><span>{item.tag}</span></button>;
              })}
            </div>
            <div className="pf-context-card" key={context.id}>
              <span className="pf-context-icon"><ContextIcon size={27} /></span>
              <h2>{context.title}</h2>
              <p>{context.description}</p>
              <div className="pf-context-question"><MapPinned size={17} aria-hidden="true" />{context.question}</div>
            </div>
            <p className="pf-inline-note">Same big idea. Three very different situations. Choose another story if you like.</p>
          </section>}

          {page.type === "map" && <section className="pf-curriculum-map" aria-label="Where graphs fit in computer science">
            <div className="pf-zero-route">
              <div className="pf-zero-route-stop"><span>01</span><div><strong>Graphs</strong><small>Places and connections</small></div></div>
              <div className="pf-zero-route-stop"><span>02</span><div><strong>Paths</strong><small>Ways to get from A to B</small></div></div>
              <div className="pf-zero-route-stop pf-zero-route-destination"><span><Check size={17}/></span><div><strong>Shortest paths</strong><small>Finding the best route with Dijkstra</small></div></div>
            </div>
            <div className="pf-zero-neighbours">
              <p>Graphs are used for other things too:</p>
              <div className="pf-zero-neighbour-grid">{otherTopics.map((topic) => <div key={topic.name} className="pf-zero-neighbour"><topic.icon size={17} aria-hidden="true" /><span>{topic.name}</span></div>)}</div>
            </div>
          </section>}

          {page.type === "ready" && <section className="pf-zero-ready" aria-label="Explore routes through town">
            <div className="pf-zero-story"><span aria-hidden="true">📍</span><p>You're at <strong>A (home)</strong> and want to reach <strong>D (the shops)</strong>. You could pass the library at B or the café at C. The numbers are travel minutes.</p></div>
            <LiveGraph nodes={nodes} edges={startingEdges} isDirected={false} width={340} height={215} mustSelectPath={false}
              highlightedNodeIds={routeIndex !== null ? routes[routeIndex].nodes : selectedNodes}
              highlightedEdgeIds={routeIndex !== null ? routes[routeIndex].edges : selectedEdges}
              onNodeClick={(id) => {playPianoNote(["A","B","C","D"].indexOf(id));setRouteIndex(null);setSelectedNodes((previous) => previous.includes(id) ? previous.filter((node) => node !== id) : [...previous, id]);}}
              onEdgeClick={(id) => {playPianoNote(startingEdges.findIndex((edge) => edge.id === id));setRouteIndex(null);setSelectedEdges((previous) => previous.includes(id) ? previous.filter((edge) => edge !== id) : [...previous, id]);}}
              onNodeMove={(id,x,y) => setNodes((previous) => previous.map((node) => node.id === id ? { ...node,x,y } : node))}
              onReset={() => {setNodes(startingNodes.map((node) => ({...node})));setSelectedNodes([]);setSelectedEdges([]);setRouteIndex(null);}} />
            <div className="pf-zero-route-explorer">
              <div className="pf-zero-explore-copy"><h2>Try different journeys</h2><p>Tap a route to see it on the map. You can also move the places around.</p></div>
              <div className="pf-zero-route-choices" role="group" aria-label="Explore different routes">
                {routes.map((route, i) => <button type="button" key={route.id} className={routeIndex===i ? "is-selected" : ""}
                  aria-pressed={routeIndex===i} onClick={() => {setRouteIndex(i);setSelectedEdges([]);setSelectedNodes([]);playPianoNote(i);}}>
                  <span><strong>{route.name}</strong><small>{route.stops}</small></span><span className="pf-zero-route-time">{route.cost} min</span>
                </button>)}
              </div>
              <p className="pf-zero-discovery" role="status">{routeIndex === null
                ? "Which journey looks quickest? Try them and see."
                : `${routes[routeIndex].name} takes ${routes[routeIndex].cost} minutes. Different journeys can take different amounts of time.`}</p>
            </div>
          </section>}
        </main>
        <div className="pf-lesson-footer"><LessonButton label={page.buttonLabel} onClick={next} /></div>
      </div>
    </div>
  );
}
