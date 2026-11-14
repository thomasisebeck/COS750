import React, { useState } from "react";
import { Award, Check, Compass, Sparkles } from "lucide-react";
import { playPianoNote } from "../helpers";
import { LiveGraph, type GraphNode, type GraphEdge } from "./LiveGraph";
import { Leaderboard } from "./Leaderboard";
import { Logo } from "./Logo";
import { LessonButton } from "./Buttons";
import { LessonCard } from "./LessonCard";

export interface LessonSummary { id: number; title: string; subtitle: string; }
interface LearningPathProps {
  lessons: LessonSummary[];
  selectedLessonId: number;
  completedLessonIds?: number[];
  onSelectLesson: (id: number) => void;
  onStartLesson: (id: number) => void;
  bestAssessmentScore?: number;
}

const heroStartingNodes: GraphNode[] = [
  {id:"A",label:"A",x:100,y:200},{id:"B",label:"B",x:300,y:80},
  {id:"C",label:"C",x:300,y:320},{id:"D",label:"D",x:500,y:200},
];
const heroEdges: GraphEdge[] = [
  {id:"AB",source:"A",target:"B"},{id:"AC",source:"A",target:"C"},
  {id:"BC",source:"B",target:"C"},{id:"BD",source:"B",target:"D"},
  {id:"CD",source:"C",target:"D"},
];

export const LearningPath: React.FC<LearningPathProps> = ({ lessons, selectedLessonId, completedLessonIds = [], onSelectLesson, onStartLesson, bestAssessmentScore = 0 }) => {
  const [heroNodes,setHeroNodes] = useState<GraphNode[]>(heroStartingNodes);
  const [heroSelections,setHeroSelections] = useState<string[]>([]);
  const [heroEdgeSelections,setHeroEdgeSelections] = useState<string[]>([]);
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0];
  return <div className="pf-screen pf-learning-path">
    <header className="pf-path-header"><Logo /><span className="pf-header-pill"><Sparkles size={14} /> LEARN BY DOING</span></header>
    <section className="pf-path-hero">
      <div className="pf-hero-copy">
        <div className="pf-eyebrow"><Compass size={16} /> GRAPHS · SHORTEST PATHS</div>
        <h1>Learn graphs by <em>trying them.</em></h1>
        <p>Start with simple connections, then work your way up to Dijkstra’s shortest-path algorithm. You’ll practise as you go.</p>
        <div className="pf-path-progress"><div><strong>{completedLessonIds.length} of {lessons.length}</strong> journeys completed</div><div className="pf-progress-track"><span style={{width:`${completedLessonIds.length / lessons.length * 100}%`}}/></div></div>
      </div>
      <div className="pf-hero-illustration" aria-label="Try the graph illustration">
        <LiveGraph nodes={heroNodes} edges={heroEdges} width={600} height={400}
          highlightedNodeIds={heroSelections}
          highlightedEdgeIds={heroEdgeSelections}
          onNodeClick={(id) => {playPianoNote(["A","B","C","D"].indexOf(id));setHeroSelections(previous => previous.includes(id) ? previous.filter(node => node!==id) : [...previous,id]);}}
          onEdgeClick={(id) => {playPianoNote(heroEdges.findIndex(edge => edge.id===id));setHeroEdgeSelections(previous => previous.includes(id) ? previous.filter(edge=>edge!==id) : [...previous,id]);}}
          onNodeMove={(id,x,y) => setHeroNodes(previous => previous.map(node => node.id===id ? {...node,x,y}:node))}
          onReset={() => {setHeroNodes(heroStartingNodes);setHeroSelections([]);setHeroEdgeSelections([]);}}
          isDirected={false} mustSelectPath={false} />
      </div>
    </section>
    <section className="pf-path-workspace" aria-label="Learning path">
      <div className="pf-path-lesson-list"><div className="pf-section-heading"><div><span className="pf-eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Your lessons</h2></div><span>Choose any lesson</span></div>
        {lessons.map((lesson) => <LessonCard key={lesson.id} number={String(lesson.id).padStart(2, "0")} title={lesson.title} subtitle={lesson.subtitle} completed={completedLessonIds.includes(lesson.id)} onClick={() => onSelectLesson(lesson.id)} className={lesson.id === selectedLessonId ? "pf-selected-card" : ""}/>)}</div>
      <div className="pf-path-side"><div className="pf-spotlight"><span className="pf-spotlight-icon">{completedLessonIds.includes(selectedLessonId) ? <Check size={24} /> : <Sparkles size={24}/>}</span><span className="pf-eyebrow">SELECTED LESSON · {String(selectedLesson.id).padStart(2, "0")}</span><h3>{selectedLesson.title}</h3><p>{selectedLesson.subtitle}</p><div className="pf-spotlight-divider"/><span className="pf-spotlight-help">{selectedLesson.id === 0 ? "Three quick discoveries: familiar situations, routes you can try, and where the ideas lead." : "Interactive examples, clear explanations and opportunities to practise."}</span><LessonButton label={completedLessonIds.includes(selectedLessonId) ? "Explore again" : `Begin lesson ${String(selectedLesson.id).padStart(2, "0")}`} onClick={() => onStartLesson(selectedLessonId)}/></div>
      <div className="pf-path-tip"><Compass size={20}/><p>Stuck on something? You can revisit any lesson.</p></div></div>
    </section>
    <section className="pf-rewards-workspace" aria-label="Your progress and assessment leaderboard">
      <div className="pf-achievement-panel"><header><Award size={23}/><div><span className="pf-eyebrow">YOUR PROGRESS</span><h2>Achievements</h2></div></header>
      <div className="pf-achievement-grid">{lessons.map((lesson) => <div key={lesson.id} className={`pf-achievement ${completedLessonIds.includes(lesson.id) ? "unlocked" : ""}`}>
        <span aria-hidden="true">{completedLessonIds.includes(lesson.id) ? "★" : "☆"}</span><strong>{lesson.title}</strong><small>{completedLessonIds.includes(lesson.id) ? "Unlocked" : "Not yet"}</small>
      </div>)}</div></div>
      <Leaderboard userScore={bestAssessmentScore}/>
    </section>
  </div>;
};
