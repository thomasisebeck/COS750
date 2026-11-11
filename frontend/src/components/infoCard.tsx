import React from 'react';

type InfoCardVariant = 'default' | 'red' | 'green';

interface InfoCardProps {
  heading: string;
  body: string;
  variant?: InfoCardVariant;
  className?: string;
}

const variantStyles: Record<
  InfoCardVariant,
  { container: string; heading: string }
> = {
  default: {
    container: 'bg-[#1a1b24] border-[#2e303e]',
    heading: 'text-[#b388ff] text-sm tracking-wide',
  },
  red: {
    container: 'bg-[#2a1c22] border-[#f07b8a]',
    heading: 'text-[#f07b8a] text-sm',
  },
  green: {
    container: 'bg-[#172b26] border-[#34d399]',
    heading: 'text-[#34d399] text-sm',
  },
};

export const InfoCard: React.FC<InfoCardProps> = ({
  heading,
  body,
  variant = 'default',
  className = '',
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      className={`w-fit max-w-sm min-w-0 px-5 py-4 rounded-2xl border flex flex-col items-center text-center gap-2 ${styles.container} ${className}`}
    >
      <div className={`flex items-center justify-center gap-2 font-semibold break-words ${styles.heading}`}>
        {variant === 'red' && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 shrink-0"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        )}

        {variant === 'green' && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 shrink-0"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}

        <span>{heading}</span>
      </div>

      <p className="text-zinc-200 text-sm leading-relaxed break-words">
        {body}
      </p>
    </div>
  );
};