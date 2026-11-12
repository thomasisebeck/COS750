import type { GraphNode, GraphEdge } from "../components/LiveGraph";

export interface LessonMeta {
  module: string;
  category: string;
  lessonNumber: number;
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

// Discriminated Union for ContentBox variants
export interface TextContentBox {
  boxType: "text";
  title: string;
  text: string;
  prohibitPathSelection?: boolean;
}

export interface GraphContentBox {
  boxType: "graph";
  state: GraphState;
  text?: string;
  prohibitPathSelection?: boolean;
}

export type QuizRetryGenerator =
  | {
      kind: "compare-routes";
      weightRange: { min: number; max: number };
      edgeSets?: string[][];
      minCostDifference?: number;
      routes: [{ optionId: string; path: string[] }, { optionId: string; path: string[] }];
      tieOptionId: string;
    }
  | {
      kind: "path-cost";
      weightRange: { min: number; max: number };
      edgeSets?: string[][];
      path: string[];
      distractorOffsets?: number[];
    };

export interface GraphQuizContentBox {
  boxType: "graph-quiz";
  state: GraphState;
  question: string;
  options: QuizOption[];
  correctAnswerId: string;
  retryGenerator?: QuizRetryGenerator;
  text?: string;
  prohibitPathSelection?: boolean;
}

export type ContentBox = TextContentBox | GraphContentBox | GraphQuizContentBox;

export interface ExtraBox {
  title: string;
  text: string;
}

export type QuestionType = "CONTINUE" | "VERT_SELECTION" | "MULT-CHOICE";

export interface LessonPage {
  category?: string;
  title: string;
  subtext: string;
  contentBox: ContentBox;
  extraBox?: ExtraBox;
  questionType: QuestionType;
  buttonLabel: string;
}

export interface LessonData {
  meta: LessonMeta;
  pages: LessonPage[];
}
