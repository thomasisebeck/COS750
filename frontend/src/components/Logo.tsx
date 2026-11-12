import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {/* Four-pointed sparkle icon */}
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4 text-[#b388ff]"
        aria-hidden="true"
      >
        <path d="M12 2C13.5 8.5 15.5 10.5 22 12C15.5 13.5 13.5 15.5 12 22C10.5 15.5 8.5 13.5 2 12C8.5 10.5 10.5 8.5 12 2Z" />
      </svg>

      {/* Brand text */}
      <span className="text-sm font-semibold tracking-tight text-white">
        PathFinder
      </span>
    </div>
  );
};