import React from "react";
import { Check } from "lucide-react";
interface OptionCardProps {label:string;disabled?:boolean;selected?:boolean;onClick?:()=>void;className?:string;}
export const OptionCard:React.FC<OptionCardProps> = ({label,disabled=false,selected=false,onClick,className=""}) => <button type="button" disabled={disabled} aria-pressed={selected} onClick={onClick} className={`pf-option-card ${selected?"is-selected":""} ${className}`}><span className="pf-option-indicator">{selected && <Check size={13} strokeWidth={3}/>}</span><span className="pf-option-label">{label}</span></button>;
