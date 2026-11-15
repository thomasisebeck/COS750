import { prepareNarrationText } from "./prepareNarration.ts";

/** Read the learner-facing content currently visible on a lesson page.
 * Do not read navigation, action buttons or hidden explanations/answers.
 */
export function collectLessonNarration(button: HTMLElement): string {
  const page = button.closest(".pf-zero-main, main, .flex-1") ?? button.closest(".pf-lesson-screen, .pf-lesson-zero");
  if (!page) return "";
  const selectors = [
    ".pf-page-title h1", ".pf-page-title > p",
    ".pf-info-card", ".pf-quiz-question", "h3", "p.text-sm.font-bold",
    ".pf-graph-svg", ".pf-option-card .pf-option-label",
    ".pf-takeaway", ".pf-context-card", ".pf-inline-note",
    ".pf-zero-story", ".pf-zero-explore-copy", ".pf-zero-route-choices button",
    ".pf-zero-discovery", ".pf-curriculum-map",
    ".pf-live-graph + p", ".pf-zero-guidance",
    ".l4-tracker", ".l4-graph-help", ".text-center.py-5",
  ];
  const candidates = Array.from(page.querySelectorAll<HTMLElement>(selectors.join(", ")));
  const selected = candidates.filter(node=> !candidates.some(other=> other!==node && other.contains(node)));
  const contents = selected.map(node=>{
    if (node.classList.contains("pf-graph-svg")) return node.getAttribute("aria-label") ?? "";
    const text = node.textContent ?? "";
    return text.replace(/\s+/g," ").trim();
  }).filter(Boolean);
  // A lesson page is short; this allows the entire lesson explanation, questions
  // and feedback to be spoken by the optional high-quality voice endpoint.
  return prepareNarrationText(contents.join(". ").replace(/([.!?])\.\s/g, "$1 ").slice(0, 2900));
}
