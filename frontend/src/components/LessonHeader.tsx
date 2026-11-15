import React from "react";
import { Home } from "lucide-react";
import { Logo } from "./Logo";
interface LessonHeaderProps {lessonNumber:string|number;onMenuClick?:()=>void;}
export const LessonHeader:React.FC<LessonHeaderProps> = ({lessonNumber,onMenuClick}) => <header className="pf-lesson-header"><Logo/><div><span className="pf-header-pill">LESSON {String(lessonNumber)}</span>{onMenuClick && <button type="button" onClick={onMenuClick} className="pf-home-button" aria-label="Back to learning path"><Home size={18}/></button>}</div></header>;
