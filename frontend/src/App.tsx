import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { playFeedbackSound } from "./helpers";
import "./App.css";
import { LearningPath, type LessonSummary } from "./components/LearningPath";
import { Lesson0Experience } from "./components/Lesson0Experience";
import { Lesson1Experience } from "./components/Lesson1Experience";
import { Lesson2Experience } from "./components/Lesson2Experience";
import { Lesson3Experience } from "./components/Lesson3Experience";
import { Lesson4Experience } from "./components/Lesson4Experience";
import { Lesson5Experience } from "./components/Lesson5Experience";
import { Lesson6Experience } from "./components/Lesson6Experience";
import { AccessibilityControls } from "./components/AccessibilityControls";
import lesson1Raw from "./lessons/lesson-1.json";
import lesson2Raw from "./lessons/lesson-2.json";
import lesson3Raw from "./lessons/lesson-3.json";
import lesson4Raw from "./lessons/lesson-4.json";
import lesson5Raw from "./lessons/lesson-5.json";
import lesson6Raw from "./lessons/lesson-6.json";
import type { LessonData } from "./types/lesson";

const lessonsMap: Record<number, LessonData> = {
  1: lesson1Raw as unknown as LessonData,
  2: lesson2Raw as unknown as LessonData,
  3: lesson3Raw as unknown as LessonData,
  4: lesson4Raw as unknown as LessonData,
  5: lesson5Raw as unknown as LessonData,
  6: lesson6Raw as unknown as LessonData,
};

const lessonList: LessonSummary[] = [
  { id: 0, title: "Why graphs matter", subtitle: "The world behind the dots" },
  { id: 1, title: "Meet the Graph", subtitle: "Vertices & edges" },
  { id: 2, title: "Follow Connections", subtitle: "Adjacency & direction" },
  { id: 3, title: "Weigh Your Options", subtitle: "Paths & costs" },
  { id: 4, title: "Find the Route", subtitle: "Dijkstra explained" },
  { id: 5, title: "Think Like Dijkstra", subtitle: "Guided practice" },
  { id: 6, title: "Prove Your Skills", subtitle: "Independent assessment" },
];

function readPreference(key: string) {
  try { return window.localStorage.getItem(key) === "true"; }
  catch { return false; }
}
function readCompleted(): number[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem("pf-completed") ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is number => Number.isInteger(id) && id >= 0 && id <= 6) : [];
  } catch { return []; }
}

function readBestScore() {
  try { return Math.max(0,Math.min(10,Number(window.localStorage.getItem("pf-assessment-best") ?? 0) || 0)); }
  catch { return 0; }
}
function App() {
  const [bestAssessmentScore,setBestAssessmentScore] = useState(readBestScore);
  const [newAchievement,setNewAchievement] = useState<number | null>(null);
  const [view, setView] = useState<"menu" | "lesson">("menu");
  const [currentLessonId, setCurrentLessonId] = useState<number>(0);
  const [completed, setCompleted] = useState<number[]>(readCompleted);
  const [highContrast, setHighContrast] = useState(() => readPreference("pf-contrast"));
  const [reducedMotion, setReducedMotion] = useState(() => readPreference("pf-motion"));
  const [soundVolume,setSoundVolume] = useState(() => {
    try {return Math.max(0,Math.min(100,Number(window.localStorage.getItem("pf-volume") ?? 100) || 0));}
    catch {return 100;}
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return window.localStorage.getItem("pf-sound") !== "false"; }
    catch { return true; }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("pf-completed", JSON.stringify(completed));
      window.localStorage.setItem("pf-contrast", String(highContrast));
      window.localStorage.setItem("pf-motion", String(reducedMotion));
      window.localStorage.setItem("pf-sound", String(soundEnabled));
      window.localStorage.setItem("pf-volume", String(soundVolume));
    } catch { /* App remains functional when storage is unavailable. */ }
  }, [completed, highContrast, reducedMotion, soundEnabled, soundVolume]);

  const saveAssessmentScore = (score:number,total:number) => {
    const normalized = Math.round(score / Math.max(1,total) * 10);
    setBestAssessmentScore(previous => {
      const best = Math.max(previous,normalized);
      try {window.localStorage.setItem("pf-assessment-best",String(best));} catch { /* Locally stored best score. */ }
      return best;
    });
  };
  const handleComplete = () => {
    if (!completed.includes(currentLessonId)) {
      setNewAchievement(currentLessonId);
      playFeedbackSound(true);
    }
    setCompleted((previous) => previous.includes(currentLessonId) ? previous : [...previous, currentLessonId]);
    setCurrentLessonId((previous) => Math.min(6, previous + 1));
    setView("menu");
  };
  const returnToMenu = () => setView("menu");
  const currentLessonData = lessonsMap[currentLessonId] ?? lessonsMap[1];

  let screen;
  if (view === "menu") {
    screen = <LearningPath lessons={lessonList} selectedLessonId={currentLessonId} completedLessonIds={completed} onSelectLesson={setCurrentLessonId} bestAssessmentScore={bestAssessmentScore} onStartLesson={(id) => {if (id !== 0 && !lessonsMap[id]) return; setCurrentLessonId(id); setView("lesson");}} />;
  } else if (currentLessonId === 0) {
    screen = <Lesson0Experience onExit={returnToMenu} onComplete={handleComplete} />;
  } else if (currentLessonId === 1) {
    screen = <Lesson1Experience lesson={currentLessonData} onExit={returnToMenu} onComplete={handleComplete} />;
  } else if (currentLessonId === 2) {
    screen = <Lesson2Experience lesson={currentLessonData} onExit={returnToMenu} onComplete={handleComplete} />;
  } else if (currentLessonId === 3) {
    screen = <Lesson3Experience lesson={currentLessonData} onExit={returnToMenu} onComplete={handleComplete} />;
  } else if (currentLessonId === 4) {
    screen = <Lesson4Experience onExit={returnToMenu} onComplete={handleComplete} />;
  } else if (currentLessonId === 5) {
    screen = <Lesson5Experience lesson={currentLessonData} onExit={returnToMenu} onComplete={handleComplete} />;
  } else {
    screen = <Lesson6Experience lesson={currentLessonData} onExit={returnToMenu} onComplete={handleComplete} onScore={saveAssessmentScore} />;
  }

  return <div className={`pf-app ${highContrast ? "pf-high-contrast" : ""} ${reducedMotion ? "pf-reduced-motion" : ""}`}>
    {screen}
    {view === "menu" && newAchievement !== null && <div className="pf-achievement-toast" role="status" aria-live="polite">
      <span className="pf-achievement-toast-star"><Sparkles size={23}/></span>
      <div><strong>Achievement unlocked!</strong><p>{lessonList.find(item => item.id===newAchievement)?.title} · +100 XP</p></div>
      <button type="button" onClick={()=>setNewAchievement(null)} aria-label="Dismiss achievement"><X size={16}/></button>
    </div>}
    <AccessibilityControls highContrast={highContrast} onContrastChange={setHighContrast} reducedMotion={reducedMotion} onMotionChange={setReducedMotion} soundEnabled={soundEnabled} onSoundChange={setSoundEnabled} soundVolume={soundVolume} onVolumeChange={setSoundVolume} />
  </div>;
}

export default App;
