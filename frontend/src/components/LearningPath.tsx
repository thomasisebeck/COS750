import React from "react";
import { ChevronRight } from "lucide-react";
import { Logo } from "./logo";
import { PageTitle } from "./PageTitle";
import { LessonButton } from "./buttons";

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

      {/* Lesson List */}
      <div className="flex-1 flex flex-col gap-3">
        {lessons.map((lesson) => {
          const isSelected = lesson.id === selectedLessonId;
          const formattedId = String(lesson.id).padStart(2, "0");

          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => onSelectLesson(lesson.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                isSelected
                  ? "bg-[#251f38] border-[#915eff]"
                  : "bg-[#181924] border-[#2e303e] hover:border-slate-600"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isSelected
                      ? "bg-[#915eff] text-white"
                      : "bg-[#232533] text-slate-300 border border-[#34374a]"
                  }`}
                >
                  {formattedId}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-100">
                    {lesson.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {lesson.subtitle}
                  </span>
                </div>
              </div>

              {!isSelected && (
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Start Button */}
      <LessonButton
        label={`Begin lesson ${formattedSelected}`}
        onClick={() => onStartLesson(selectedLessonId)}
      />
    </div>
  );
};