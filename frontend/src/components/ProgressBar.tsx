import React from "react";
import { ChevronLeft } from "lucide-react";

interface ProgressBarProps {
  currentIndex: number;
  total: number;
  onBack: () => void;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentIndex,
  total,
  onBack,
  className = "",
}) => {
  const safeTotal = Math.max(1, total);
  const progressPercent = ((currentIndex + 1) / safeTotal) * 100;

  return (
    <div className={`flex items-center gap-3 shrink-0 ${className}`}>
      <button
        type="button"
        disabled={currentIndex === 0}
        onClick={onBack}
        aria-label="Previous page"
        className="text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex-1 bg-slate-800 h-1.5 overflow-hidden rounded-full">
        <div
          className="bg-purple-500 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <span className="text-xs text-slate-400 font-mono">
        {currentIndex + 1} / {safeTotal}
      </span>
    </div>
  );
};