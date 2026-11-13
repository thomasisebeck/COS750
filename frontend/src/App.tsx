import { useState } from "react";
import "./App.css";
import { LearningPath, type LessonSummary } from "./components/LearningPath";
// import { Lesson1Experience } from "./components/Lesson1Experience";
// import { Lesson2Experience } from "./components/Lesson2Experience";
import { Lesson6Experience } from "./components/Lesson6Experience";
// import lesson1Raw from "./lessons/lesson-1.json";
// import lesson2Raw from "./lessons/lesson-2.json";
import lesson6Raw from "./lessons/lesson-6.json";
import type { LessonData } from "./types/lesson";

const lessonsMap: Record<number, LessonData> = {
  // 1: lesson1Raw as unknown as LessonData,
  // 2: lesson2Raw as unknown as LessonData,
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
          if (!lessonsMap[id]) {
            alert("This lesson is coming soon!");
            return;
          }
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

  return (
    <>
      {/* {currentLessonId === 1 && (
        <Lesson1Experience
          lesson={currentLessonData}
          onExit={() => setView("menu")}
          onComplete={handleComplete}
        />
      )}
      {currentLessonId === 2 && (
        <Lesson2Experience
          lesson={currentLessonData}
          onExit={() => setView("menu")}
          onComplete={handleComplete}
        />
      )} */}
      {currentLessonId === 6 && (
        <Lesson6Experience
          lesson={currentLessonData}
          onExit={() => setView("menu")}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}

export default App;