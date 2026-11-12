import React from 'react';

interface LessonButtonProps {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const LessonButton: React.FC<LessonButtonProps> = ({
  label,
  disabled = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`disabled:opacity-50 disabled:cursor-not-allowed group w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#915eff] hover:bg-[#824df5] active:scale-[0.98] text-white font-semibold text-base transition-all duration-150 cursor-pointer ${className}`}
    >
      <span>{label}</span>

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
    </button>
  );
};



///////////////

//How to use

{/* <LessonButton
  label="Begin lesson 01"
  onClick={() => console.log('Starting lesson 01')}
/> */}

///////////////