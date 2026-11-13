import React from 'react';

interface OptionCardProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  label,
  selected = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-colors duration-200 text-left cursor-pointer ${
        selected
          ? 'bg-[#221c33] border-[#8e5bf5]'
          : 'bg-[#1a1b24] border-[#2e303e] hover:border-[#4b4e63]'
      } ${className}`}
    >
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
          selected
            ? 'bg-[#915eff]'
            : 'border-2 border-[#8c90a6]'
        }`}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>

      <span className="text-white font-medium text-sm leading-snug truncate">
        {label}
      </span>
    </button>
  );
};



////////////////

//How to use

{/* <OptionCard
    label="A → D  •  cost 10"
    selected={selected === 'A'}
    onClick={() => setSelected('A')}
/> */}

////////////////