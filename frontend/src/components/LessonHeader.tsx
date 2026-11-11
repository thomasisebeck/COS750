import React from "react";
import { Logo } from "./Logo";

interface LessonHeaderProps {
  lessonNumber: string | number;
}

export const LessonHeader: React.FC<LessonHeaderProps> = ({ lessonNumber }) => {
  return (
    <div className="flex items-center justify-between text-xs text-slate-400">
      <Logo />
      <span className="uppercase tracking-widest text-[10px] text-slate-400 font-medium">
        LESSON {lessonNumber}
      </span>
    </div>
  );
};