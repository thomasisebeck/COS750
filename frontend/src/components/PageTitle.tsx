import React from "react";
import { SpeechButton } from "./SpeechButton";
import { collectLessonNarration } from "./lessonNarration";
interface PageTitleProps {category?:string;title:string;subtext?:string;}
export const PageTitle:React.FC<PageTitleProps> = ({category,title,subtext}) => <header className="pf-page-title">{category && <span className="pf-eyebrow">{category}</span>}<div className="pf-page-heading"><h1>{title}</h1><SpeechButton text={`${title}. ${subtext ?? ""}`} getText={collectLessonNarration}/></div>{subtext && <p>{subtext}</p>}</header>;
