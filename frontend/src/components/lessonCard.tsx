import React from 'react';

interface LessonCardProps {
  number: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
  className?: string;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  number,
  title,
  subtitle,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full max-w-md flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-[#181924] border border-[#2e303e] hover:bg-[#251f38] hover:border-[#915eff] transition-all duration-200 text-left cursor-pointer shadow-sm ${className}`}
    >
      <div className="w-11 h-11 rounded-full bg-[#232533] border border-[#34374a] group-hover:bg-[#915eff] group-hover:border-[#c4a6ff] flex items-center justify-center shrink-0 transition-colors duration-200">
        <span className="text-white font-bold text-sm leading-none">
          {number}
        </span>
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-white font-semibold text-base leading-snug truncate">
          {title}
        </span>
        <span className="text-slate-400 text-xs leading-snug truncate">
          {subtitle}
        </span>
      </div>

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 ml-auto text-slate-500 group-hover:text-purple-300 transition-colors duration-200 shrink-0"
        aria-hidden="true"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
};