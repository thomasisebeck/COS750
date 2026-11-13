import React from 'react';
import { Home } from 'lucide-react';
import { Logo } from './Logo';

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
            className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};