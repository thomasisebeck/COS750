import type { GraphQuizContentBox, GraphState, LessonData, LessonPage, QuizOption } from "../types/lesson";
import { adjacentVertices } from "./graphFacts.ts";

/** Questions are built from graph facts, not from a hard-coded answer index. */
const pick = (items: number[], attempt: number) => items[(attempt - 1) % items.length];
const options = (labels: string[], correct: number): Pick<GraphQuizContentBox, "options" | "correctAnswerId"> => ({
  options: labels.map((label, index) => ({ id: `answer-${index}`, label })),
  correctAnswerId: `answer-${correct}`,
});
const graph = (weights: number[]): GraphState => ({
  nodes: [
    { id: "A", label: "A", x: 100, y: 200 },
    { id: "B", label: "B", x: 300, y: 80 },
    { id: "C", label: "C", x: 300, y: 320 },
    { id: "D", label: "D", x: 500, y: 200 },
  ],
  edges: [["AB","A","B"],["AC","A","C"],["BC","B","C"],["BD","B","D"],["CD","C","D"]].map(([id, source, target], index) => ({id,source,target,label: String(weights[index])})),
  highlightedNodes: [], highlightedEdges: [],
});

/** New graph and correct answer, including a different vertex count/adjacency set. */
export function lesson1Retry(index: number, attempt: number): GraphQuizContentBox {
  const count = index === 2 ? pick([5, 3, 6, 4], attempt) : 4;
  const labels = "ABCDEF".slice(0, count).split("");
  // A is the hub; spread all other vertices vertically so no edge runs
  // through an unrelated vertex (the previous A–C line passed through B).
  const nodes = labels.map((label, i) => ({
    id: label, label,
    x: i === 0 ? 115 : 455,
    y: i === 0 ? 200 : 65 + (i-1) * (270 / Math.max(1, count-2)),
  }));
  if (index !== 2) {
    const locations = [{x:100,y:200},{x:300,y:75},{x:300,y:325},{x:500,y:200}];
    nodes.forEach((node,i)=>Object.assign(node,locations[i]));
  }
  const edges = index === 2 ? labels.slice(1).map((label) => ({id:`A${label}`,source:"A",target:label})) :
    (attempt % 2 ? [["A","C"],["A","D"],["B","C"],["B","D"]] : [["A","B"],["A","D"],["B","C"],["C","D"]]).map(([source,target]) => ({id:`${source}${target}`,source,target}));
  const neighbourLabels = adjacentVertices({nodes,edges,highlightedNodes:[],highlightedEdges:[]},"A");
  const target = index === 2 ? `${count} vertices` : neighbourLabels.join(" and ");
  const wrong = index === 2 ? [`${count-1} vertices`,`${count+1} vertices`] : ["B and C", "B and D", "C and D", "A and D"].filter(item => item !== target).slice(0,2);
  const labelsToShow = [target,...wrong].sort((a,b) => ((a.length + attempt) % 3) - ((b.length + attempt) % 3));
  return {boxType:"graph-quiz",state:{nodes,edges,highlightedNodes:[],highlightedEdges:[]},isDirected:false,
    question:index === 2 ? "How many labelled vertices are there now?" : "Which vertices share an edge with A?",
    ...options(labelsToShow, labelsToShow.indexOf(target)),
    explanation:index === 2 ? `Count the circles, not the lines: ${count} labelled vertices.` : `Look at edges starting at A. Its neighbours are ${target}.`,
  };
}

/** A fresh direction question carries its own graph: the arrow matches the explanation. */
export function lesson2Retry(attempt: number): GraphQuizContentBox {
  const reverse = attempt % 2 === 0;
  const from = reverse ? "B" : "A";
  const to = reverse ? "A" : "B";
  return {boxType:"graph-quiz",state:{nodes:[{id:"A",label:"A",x:180,y:190},{id:"B",label:"B",x:420,y:190}],edges:[{id:`${from}${to}`,source:from,target:to}],highlightedNodes:[],highlightedEdges:[]},isDirected:true,
    question:"Which direction is allowed by the arrow?",...options(["A to B only","B to A only","Both directions","Neither"], reverse ? 1 : 0),
    explanation:`The arrow points from ${from} to ${to}, so this single edge only guarantees ${from} to ${to}.`,
  };
}

const toOptions = (correct: string, incorrect: string[], seed: number): {options: QuizOption[];correctAnswerId:string} => {
  const labels = [correct,...new Set(incorrect.filter(text => text !== correct))].slice(0,3);
  const rotation = seed % labels.length;
  const rotated = [...labels.slice(rotation),...labels.slice(0,rotation)];
  return options(rotated,rotated.indexOf(correct));
};

/** Coherent guided exercise: B is visited before C, and C eventually improves D. */
export function guidedPracticeBank(base: LessonData, attempt: number): LessonData {
  const ab = pick([2,3,1,4],attempt), bc = pick([1,2,3],attempt), cd = pick([2,3,1],attempt);
  const ac = ab+bc+pick([3,2,4],attempt), bd = bc+cd+pick([2,4,3],attempt);
  const c = ab+bc, viaB = ab+bd, viaC = c+cd;
  const pages = base.pages.map((p) => ({...p}));
  const starting = pages[0].contentBox;
  if (!starting || starting.boxType !== "graph") return base;
  pages[0].contentBox = {...starting,state:graph([ab,ac,bc,bd,cd])};
  pages[0].cardText = `Start at A and find the shortest route to D. This graph has a new set of edge weights.`;
  const update = (index:number, cardTitle:string, subtext:string, right:string, wrong:string[], explanation:string) => {
    const p=pages[index];p.cardTitle=cardTitle;p.subtext=subtext;
    Object.assign(p,toOptions(right,wrong,attempt+index));
    p.correctFeedback=explanation;p.incorrectFeedback=`Hint: ${explanation}`;
  };
  update(1,"What is the starting distance at A?","Every Dijkstra run begins the same way.","0",["1","∞"],"The source A begins at 0; all other vertices begin at infinity.");
  update(2,"What distance should B receive?",`The edge A–B weighs ${ab}.`,`${ab}`,[`${ac}`,`${ab+ac}`],`0 + ${ab} = ${ab}. B is directly connected to A.`);
  update(3,"Which vertex is visited next?",`After visiting A: B = ${ab}, C = ${ac}, D = ∞.`,`B (distance ${ab})`,[`C (distance ${ac})`,`D (distance ∞)`],`B has the smallest unsettled distance, ${ab}.`);
  update(4,"Does the route through B improve C?",`C currently costs ${ac}; B costs ${ab} and B–C weighs ${bc}.`,`Yes, C becomes ${c}`,[`No, keep ${ac}`,`Yes, C becomes ${bc}`],`${ab} + ${bc} = ${c}, which is smaller than ${ac}.`);
  update(5,"Record D's distance and predecessor",`B has distance ${ab}; edge B–D weighs ${bd}.`,`${viaB} via B`,[`${bd} via A`,`${ab} via A`],`${ab} + ${bd} = ${viaB}; D's predecessor is B.`);
  update(6,"Which unsettled vertex is next?",`C = ${c}, D = ${viaB}.`,`C (distance ${c})`,[`D (distance ${viaB})`,`A (distance 0)`],`C has distance ${c}; A and B are already settled.`);
  update(7,"Does C improve D?",`D currently costs ${viaB}; C costs ${c}, and C–D weighs ${cd}.`,`Yes, D becomes ${viaC}`,[`No, keep ${viaB}`,`Yes, D becomes ${cd}`],`${c} + ${cd} = ${viaC}, which improves ${viaB}.`);
  update(8,"Which is the shortest route?",`Trace the predecessors back from D.`,`A → B → C → D (${viaC})`,[`A → B → D (${viaB})`,`A → C → D (${ac+cd})`],`The cheapest route is A → B → C → D, costing ${ab} + ${bc} + ${cd} = ${viaC}.`);
  pages[9].cardText = `A → B → C → D costs ${ab} + ${bc} + ${cd} = ${viaC}.`;
  return {...base,pages};
}

/** One random, internally consistent four-vertex assessment. All fourteen answers derive from the same graph. */
export function assessmentBank(base: LessonData, attempt: number): LessonData {
  const ac=pick([2,1,3],attempt), bc=pick([1,2],attempt), ab=ac+bc+pick([2,3],attempt);
  const bd=pick([3,4,5],attempt), cd=bc+bd+pick([2,4],attempt);
  const viaB=ac+bc+bd, directB=ab+bd, directC=ac+cd;
  const baseState=graph([ab,ac,bc,bd,cd]);
  const pages:LessonPage[]=base.pages.map(page=>({...page}));
  const first=pages[0].contentBox;
  if (first?.boxType === "graph") pages[0].contentBox={...first,state:baseState};
  function setQuiz(index:number,question:string,right:string,wrong:string[],explanation:string,customState?:GraphState) {
    const current=pages[index].contentBox;
    if (!current || (current.boxType!=="graph-quiz" && current.boxType!=="quiz")) return;
    pages[index].contentBox={boxType:"graph-quiz",question,...toOptions(right,wrong,attempt+index),explanation,state:customState??baseState,isDirected:!!customState,readOnly:true};
  }
  setQuiz(1,"How many labelled vertices are shown?","4",["3","5"],"Each circle A, B, C and D represents one vertex.");
  const reverse=attempt%2===0;
  const from=reverse?"B":"A", to=reverse?"A":"B";
  setQuiz(2,`Look at the arrow. Which direction does ${from} → ${to} allow?`,`${from} to ${to} only`,[`${to} to ${from} only`,"Both directions"],"In a directed graph, the arrow indicates which direction is permitted.",{
    nodes:[{id:"A",label:"A",x:175,y:190},{id:"B",label:"B",x:425,y:190}],edges:[{id:"dir",source:from,target:to}],highlightedNodes:[],highlightedEdges:[]});
  setQuiz(3,"What is the cost of A → C → B → D?",String(viaB),[String(directB),String(viaB+bc)],`${ac} + ${bc} + ${bd} = ${viaB}. Add the weights of the three edges on the route.`);
  setQuiz(4,"Which distances should Dijkstra initialise?","A = 0; B, C, D = ∞",["All vertices = 0","A = ∞; all others = 0"],"The source A starts at 0. Every other vertex is initially at infinity.");
  setQuiz(5,"After relaxing A's edges, what are B and C's tentative distances?",`B = ${ab}; C = ${ac}`,[`B = ${ac}; C = ${ab}`,`B = ${ab}; C = ${ab+ac}`],`The direct edges from A have costs ${ab} to B and ${ac} to C.`);
  setQuiz(6,"After visiting A, which unsettled vertex is next?",`C (${ac})`,[`B (${ab})`,`D (∞)`],`C has tentative distance ${ac}, smaller than B's ${ab}.`);
  setQuiz(7,`B was ${ab}. What happens when C (${ac}) relaxes C–B (${bc})?`,`B becomes ${ac+bc}`,[`B stays ${ab}`,`B becomes ${bc}`],`${ac} + ${bc} = ${ac+bc}, better than ${ab}.`);
  setQuiz(8,`B's distance is ${ac+bc}; B–D costs ${bd}. What is D's new distance?`,String(viaB),[String(bd),String(directC)],`${ac+bc} + ${bd} = ${viaB}. This is better than ${directC} through C directly.`);
  setQuiz(9,"Which route from A to D is cheapest?",`A → C → B → D (${viaB})`,[`A → B → D (${directB})`,`A → C → D (${directC})`],`A → C → B → D totals ${ac} + ${bc} + ${bd} = ${viaB}.`);
  const restriction = attempt%2===0 ? "Dijkstra requires non-negative edge weights" : "Dijkstra is safe when every edge weight is non-negative";
  setQuiz(10,"What assumption does standard Dijkstra make?",restriction,["All edge weights must be identical","The graph cannot contain cycles"],"Dijkstra's usual correctness guarantee requires non-negative edge weights.");
  setQuiz(11,"Which vertices share a direct edge with C?","A, B and D",["A and D","B and D"],"C has direct edges to A, B and D. Each connection counts as a neighbour.");
  setQuiz(12,"What is the total cost of A → B → D?",String(directB),[String(viaB),String(directB+2)],`A–B costs ${ab} and B–D costs ${bd}, so the route costs ${ab} + ${bd} = ${directB}.`);
  setQuiz(13,"Which vertex comes immediately before D on the shortest A-to-D route?","B",["A","C"],"The least-cost route is A → C → B → D. The vertex before D is B.");
  setQuiz(14,"How much cheaper is A → C → B → D than A → B → D?",String(directB-viaB),[String(directB-viaB+1),String(directB)],`The two route costs are ${viaB} and ${directB}; the difference is ${directB-viaB}.`);
  return {...base,pages};
}

/** The adjacency check can reuse the previous vertex-count retry graph. */
export function lesson1FollowUp(state: GraphState, attempt: number): GraphQuizContentBox {
  const neighbours = adjacentVertices(state,"A");
  const right = neighbours.join(", ");
  // Offer plausible distinct choices and never make the true answer ambiguous.
  const wrong = [neighbours.slice(0,-1).join(", "),neighbours.slice(1).join(", "),
    state.nodes.map(node=>node.id).filter(id=>id!=="A" && !neighbours.includes(id)).join(", ")]
    .filter(value=>value && value!==right);
  return {boxType:"graph-quiz",state,isDirected:false,
    question:"Which vertices share an edge with A on THIS graph?",
    ...toOptions(right,wrong,attempt),
    explanation:`A has direct edges to ${right}. Only one edge is needed for two vertices to be adjacent.`,
  };
}
