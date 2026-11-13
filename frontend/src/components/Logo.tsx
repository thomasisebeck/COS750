import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Node & Edge Network Icon */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-[#b388ff]"
        aria-hidden="true"
      >
        <line x1="4" y1="12" x2="12" y2="6" />
        <line x1="12" y1="6" x2="20" y2="12" />
        <line x1="12" y1="6" x2="12" y2="18" />
        <circle cx="4" cy="12" r="2.5" fill="currentColor" stroke="none" />
        <circle cx="20" cy="12" r="2.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="6" r="2.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="18" r="2.5" fill="currentColor" stroke="none" />
      </svg>

      {/* Brand text */}
      <span className="text-sm font-semibold tracking-tight text-white">
        PathFinder
      </span>
    </div>
  );
};