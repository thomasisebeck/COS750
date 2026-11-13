import React from "react";
import { Logo } from "./Logo";
import { PageTitle } from "./PageTitle";
import { LessonButton } from "./Buttons";
import { LessonCard } from "./LessonCard";

export interface LessonSummary {
  id: number;
  title: string;
  subtitle: string;
}

interface LearningPathProps {
  lessons: LessonSummary[];
  selectedLessonId: number;
  onSelectLesson: (id: number) => void;
  onStartLesson: (id: number) => void;
}

export const LearningPath: React.FC<LearningPathProps> = ({
  lessons,
  selectedLessonId,
  onSelectLesson,
  onStartLesson,
}) => {
  const formattedSelected = String(selectedLessonId).padStart(2, "0");

  return (
    <div className="w-full min-h-screen bg-[#111116] text-slate-100 p-6 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Logo />
      </div>

      {/* Title */}
      <PageTitle
        category="YOUR LEARNING PATH"
        title="Graphs & shortest paths"
        subtext="Six quick challenges. One big idea."
      />

      {/* Lesson List using LessonCard */}
      <div className="flex-1 flex flex-col gap-3 max-w-md mx-auto w-full">
        {lessons.map((lesson) => {
          const isSelected = lesson.id === selectedLessonId;
          const formattedId = String(lesson.id).padStart(2, "0");

          return (
            <LessonCard
              key={lesson.id}
              number={formattedId}
              title={lesson.title}
              subtitle={lesson.subtitle}
              onClick={() => onSelectLesson(lesson.id)}
              className={
                isSelected
                  ? "!bg-[#251f38] !border-[#915eff] shadow-lg shadow-purple-950/30"
                  : ""
              }
            />
          );
        })}
      </div>

      {/* Start Button */}
      <div className="max-w-md mx-auto w-full">
        <LessonButton
          label={`Begin lesson ${formattedSelected}`}
          onClick={() => onStartLesson(selectedLessonId)}
        />
      </div>
    </div>
  );
};