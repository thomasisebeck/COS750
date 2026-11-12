// import type { GraphNode, GraphEdge } from "../components/LiveGraph";

// export interface LessonMeta {
//   module: string;
//   category: string;
//   lessonNumber: number;
// }

// export interface GraphState {
//   nodes: GraphNode[];
//   edges: GraphEdge[];
//   highlightedNodes: string[];
//   highlightedEdges: string[];
// }

// export interface QuizOption {
//   id: string;
//   label: string;
// }

// // Discriminated Union for ContentBox variants
// export interface TextContentBox {
//   boxType: "text";
//   title: string;
//   text: string;
//   prohibitPathSelection?: boolean;
// }

// export interface GraphContentBox {
//   boxType: "graph";
//   state: GraphState;
//   text?: string;
//   prohibitPathSelection?: boolean;
// }

// export interface GraphQuizContentBox {
//   boxType: "graph-quiz";
//   state: GraphState;
//   question: string;
//   options: QuizOption[];
//   correctAnswerId: string;
//   text?: string;
//   prohibitPathSelection?: boolean;
// }

// export type ContentBox = TextContentBox | GraphContentBox | GraphQuizContentBox;

// export interface ExtraBox {
//   title: string;
//   text: string;
// }

// export type QuestionType = "CONTINUE" | "VERT_SELECTION" | "MULT-CHOICE";

// export interface LessonPage {
//   title: string;
//   subtext: string;
//   contentBox: ContentBox;
//   extraBox?: ExtraBox;
//   questionType: QuestionType;
//   buttonLabel: string;
// }

// export interface LessonData {
//   meta: LessonMeta;
//   pages: LessonPage[];
// }


export interface LessonMeta {
  module: string;
  lessonNumber: number;
  title?: string;
  topic?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightedNodes: string[];
  highlightedEdges: string[];
}

export interface QuizOption {
  id: string;
  label: string;
}

export interface TextContentBox {
  boxType: "text";
  title?: string;
  text?: string;
  variant?: "default" | "red" | "green";
}

export interface GraphContentBox {
  boxType: "graph";
  state?: GraphState;
  text?: string;
  prohibitPathSelection?: boolean;
  isDirected?: boolean;
}

export interface GraphQuizContentBox {
  boxType: "graph-quiz";
  state?: GraphState;
  question?: string;
  options?: QuizOption[];
  correctAnswerId?: string;
  text?: string;
  prohibitPathSelection?: boolean;
  isDirected?: boolean;
}

export type ContentBox = TextContentBox | GraphContentBox | GraphQuizContentBox;

export interface ExtraBox {
  title: string;
  text: string;
}

export type QuestionType = "CONTINUE" | "VERT_SELECTION" | "MULT-CHOICE";

export interface LessonPage {
  title: string;
  subtext: string;
  category?: string;
  eyebrow?: string;
  type?: string;
  buttonLabel?: string;
  button?: string;
  cardTitle?: string;
  cardText?: string;
  tipTitle?: string;
  tipText?: string;
  question?: string;
  options?: QuizOption[];
  correctAnswerId?: string;
  correctFeedback?: string;
  incorrectFeedback?: string;
  contentBox?: ContentBox;
  extraBox?: ExtraBox;
  questionType?: QuestionType;
}

export interface LessonData {
  meta: LessonMeta;
  pages: LessonPage[];
}