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
      className={`group w-full max-w-md flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-[#1d1f29] border-2 border-[#0088ff] hover:bg-[#2b1e3e] hover:border-[#8e5bf5] transition-colors duration-200 text-left cursor-pointer ${className}`}
    >
        
      <div className="w-11 h-11 rounded-full bg-[#1d1f29] border-2 border-[#474b5c] group-hover:bg-[#8e5bf5] group-hover:border-[#c4a6ff] flex items-center justify-center shrink-0 transition-colors duration-200">
        <span className="text-white font-bold text-sm leading-none">
          {number}
        </span>
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-white font-semibold text-base leading-snug truncate">
          {title}
        </span>
        <span className="text-zinc-400 text-xs leading-snug truncate">
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
        className="w-4 h-4 ml-auto text-zinc-400 group-hover:opacity-0 transition-opacity duration-200 shrink-0"
        aria-hidden="true"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
};


//////////////////

//How to use it:

// import { LessonCard } from './components/lessonCard';

// export default function App() {
//   return (
//     <div className="min-h-screen bg-[#111116] flex flex-col items-center justify-center gap-4 p-6">
//       <LessonCard
//         number="01"
//         title="Meet the Graph"
//         subtitle="Vertices & edges"
//         onClick={() => console.log('Lesson 01')}
//       />
//       <LessonCard
//         number="02"
//         title="Follow Connections"
//         subtitle="Adjacency & direction"
//         onClick={() => console.log('Lesson 02')}
//       />
//     </div>
//   );
// }

//////////////////