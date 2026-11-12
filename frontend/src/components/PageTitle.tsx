import React from "react";

interface PageTitleProps {
  category?: string;
  title: string;
  subtext: string;
}

export const PageTitle: React.FC<PageTitleProps> = ({
  category,
  title,
  subtext,
}) => {
  return (
    <div>
      {category && (
        <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase">
          {category}
        </span>
      )}
      <h1 className="text-2xl font-bold text-slate-100 mt-1">{title}</h1>
      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
        {subtext}
      </p>
    </div>
  );
};