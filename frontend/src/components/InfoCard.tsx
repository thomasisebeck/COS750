import React from "react";
import { CheckCircle2, Info, Lightbulb } from "lucide-react";
type InfoCardVariant="default"|"red"|"green";
interface InfoCardProps {heading:string;body:string;variant?:InfoCardVariant;className?:string;}
export const InfoCard:React.FC<InfoCardProps> = ({heading,body,variant="default",className=""}) => <div className={`pf-info-card pf-info-${variant} ${className}`} role={variant==="red"?"alert":undefined}><div className="pf-info-heading">{variant==="green"?<CheckCircle2 size={18}/>:variant==="red"?<Lightbulb size={18}/>:<Info size={18}/>}<strong>{heading}</strong></div><p>{body}</p></div>;
