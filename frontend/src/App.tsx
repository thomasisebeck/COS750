import { useState } from "react";
import "./App.css";
import { LearningPath, type LessonSummary } from "./components/LearningPath";
import { Lesson1Experience } from "./components/Lesson1Experience";
import { Lesson2Experience } from "./components/Lesson2Experience";
import { Lesson3Experience } from "./components/Lesson3Experience";
import { Lesson4Experience } from "./components/Lesson4Experience";
import { Lesson5Experience } from "./components/Lesson5Experience";
import { Lesson6Experience } from "./components/Lesson6Experience";
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
  { id: 1, title: "Meet the Graph", subtitle: "Vertices & edges" },
  { id: 2, title: "Follow Connections", subtitle: "Adjacency & direction" },
  { id: 3, title: "Weigh Your Options", subtitle: "Paths & costs" },
  { id: 4, title: "Find the Route", subtitle: "Dijkstra explained" },
  { id: 5, title: "Think Like Dijkstra", subtitle: "Guided practice" },
  { id: 6, title: "Prove Your Skills", subtitle: "Independent assessment" },
];

function App() {
  const [view, setView] = useState<"menu" | "lesson">("menu");
  const [currentLessonId, setCurrentLessonId] = useState<number>(1);

  if (view === "menu") {
    return (
      <LearningPath
        lessons={lessonList}
        selectedLessonId={currentLessonId}
        onSelectLesson={(id) => setCurrentLessonId(id)}
        onStartLesson={(id) => {
          if (!lessonsMap[id]) return;
          setCurrentLessonId(id);
          setView("lesson");
        }}
      />
    );
  }

  const currentLessonData = lessonsMap[currentLessonId] ?? lessonsMap[1];

  const handleComplete = () => {
    if (currentLessonId < lessonList.length) {
      setCurrentLessonId((prev) => prev + 1);
    }
    setView("menu");
  };

  if (currentLessonId === 1) {
    return (
      <Lesson1Experience
        lesson={currentLessonData}
        onExit={() => setView("menu")}
        onComplete={handleComplete}
      />
    );
  }

  if (currentLessonId === 2) {
    return (
      <Lesson2Experience
        lesson={currentLessonData}
        onExit={handleComplete}
      />
    );
  }

  if (currentLessonId === 3) {
    return (
      <Lesson3Experience
        lesson={currentLessonData}
        onExit={() => setView("menu")}
        onComplete={handleComplete}
      />
    );
  }

  if (currentLessonId === 4) {
    return (
      <Lesson4Experience
        onExit={() => setView("menu")}
        onComplete={handleComplete}
      />
    );
  }

  if (currentLessonId === 5) {
    return (
      <Lesson5Experience
        lesson={currentLessonData}
        onExit={() => setView("menu")}
        onComplete={handleComplete}
      />
    );
  }

  if (currentLessonId === 6) {
    return (
      <Lesson6Experience
        lesson={currentLessonData}
        onExit={() => setView("menu")}
        onComplete={handleComplete}
      />
    );
  }

  return null;
}

export default App;