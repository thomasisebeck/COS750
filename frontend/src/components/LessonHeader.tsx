import React from "react";
import { Logo } from "./Logo";

interface LessonHeaderProps {
  lessonNumber: string | number;
  onMenuClick?: () => void;
}

export const LessonHeader: React.FC<LessonHeaderProps> = ({
  lessonNumber,
  onMenuClick,
}) => {
  return (
    <div className="flex items-center justify-between text-xs text-slate-400">
      <Logo />

      <div className="flex items-center gap-3">
        <span className="uppercase tracking-widest text-[10px] text-slate-400 font-medium">
          LESSON {lessonNumber}
        </span>

        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Back to learning path"
            className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {/* Change this to house */}
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};