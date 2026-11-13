import React from 'react';

interface LessonButtonProps {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  showArrow?: boolean;
}

export const LessonButton: React.FC<LessonButtonProps> = ({
  label,
  disabled = false,
  onClick,
  className = '',
  showArrow = true,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`disabled:opacity-50 disabled:cursor-not-allowed group w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#0d9488] hover:bg-[#0f766e] active:scale-[0.98] text-white font-semibold text-base transition-all duration-150 cursor-pointer shadow-lg shadow-teal-950/30 ${className}`}
    >
      <span>{label}</span>
      {showArrow && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-150"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      )}
    </button>
  );
};