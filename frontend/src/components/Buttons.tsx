import React from "react";
import { ArrowRight } from "lucide-react";
interface LessonButtonProps { label?:string; disabled?:boolean; onClick?:()=>void; className?:string; showArrow?:boolean; }
export const LessonButton:React.FC<LessonButtonProps> = ({label="Continue",disabled=false,onClick,className="",showArrow=true}) => <button type="button" disabled={disabled} onClick={onClick} className={`pf-primary-button ${className}`}><span>{label}</span>{showArrow && <ArrowRight size={18} aria-hidden="true"/>}</button>;
