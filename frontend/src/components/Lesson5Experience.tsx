// import { useState } from 'react'
// import WeightedGraph from './WeightedGraph'
// import AnswerOptions from './AnswerOptions'

// const steps = [
//   { title: 'Set the starting values', description: 'Before exploring, initialise your distance table.', question: 'What is the distance to the source A?', options: ['∞ (infinity)', '0', '1'], correct: 1, hint: 'The source is distance 0 from itself. Every other vertex starts at infinity.', explanation: 'A = 0. B, C and D = ∞. All predecessors start empty.' },
//   { title: 'Explore A’s neighbours', description: 'A has distance 0. Its edges reach B and C.', question: 'What tentative distance should B receive?', options: ['2', '5', '7'], correct: 0, active: 'A', hint: 'Add the distance to A (0) to the weight of A–B (2): 0 + 2 = 2.', explanation: 'B receives 2 and C receives 5. Both have predecessor A.' },
//   { title: 'Choose the next vertex', description: 'A is done. The unsettled distances are B: 2, C: 5, D: ∞.', question: 'Which vertex is selected next?', options: ['B (distance 2)', 'C (distance 5)', 'D (distance ∞)'], correct: 0, active: 'A', hint: 'Select the unsettled vertex with the smallest tentative distance. Compare 2, 5 and infinity.', explanation: 'B has the smallest unsettled distance, 2, so settle B next.' },
//   { title: 'Find a shorter way to C', description: 'Current distance C = 5. B has distance 2; B–C weighs 1.', question: 'Should C’s distance be updated?', options: ['Yes: 2 + 1 = 3', 'No: keep 5', 'Yes: 2 + 1 = 1'], correct: 0, hint: 'A route through B costs 2 + 1 = 3. Update when the new distance is smaller than the current distance.', explanation: 'Update C to 3 and change its predecessor to B.' },
//   { title: 'Record a predecessor', description: 'B has distance 2 and its edge to D weighs 6.', question: 'What are D’s new distance and predecessor?', options: ['6 and A', '8 and B', '∞ and none'], correct: 1, hint: 'The route through B costs 2 + 6 = 8. The predecessor is the vertex immediately before D: B.', explanation: 'D receives distance 8 and predecessor B.' },
//   { title: 'Find the next minimum', description: 'Unsettled: C: 3 and D: 8. Choose the smallest.', question: 'Who should be settled next?', options: ['C (distance 3)', 'D (distance 8)', 'A (distance 0)'], correct: 0, active: 'B', hint: 'A and B are already settled. Of C (distance 3) and D (distance 8), choose the smallest.', explanation: 'Settle C, the remaining vertex with the smallest distance, 3.' },
//   { title: 'Improve D through C', description: 'C has distance 3; its edge to D weighs 2.', question: 'Candidate = 3 + 2. What happens to D?', options: ['Keep 8', 'Update to 5; predecessor C', 'Update to 2; predecessor C'], correct: 1, hint: 'If the current distance is 8 and a new route costs 5, update to 5 and change the predecessor to C.', explanation: '3 + 2 = 5 is smaller than 8. D now has distance 5 and predecessor C.' },
//   { title: 'Rebuild the path', description: 'The final predecessor chain is D ← C ← B ← A.', question: 'Which path has total cost 5?', options: ['A → B → C → D', 'A → B → D', 'A → C → D'], correct: 0, hint: 'Follow predecessors backwards from D, then reverse the order. The edge weights are 2, 1 and 2.', explanation: 'A → B → C → D costs 2 + 1 + 2 = 5.' },
// ]

// export default function LessonFive() {
//   const [screen, setScreen] = useState(0)
//   const [selected, setSelected] = useState<number | null>(null)
//   const [feedback, setFeedback] = useState<'correct' | 'hint' | null>(null)
//   const [assessment, setAssessment] = useState(false)
//   const step = steps[screen - 1]
//   const complete = screen === 9
//   const progress = complete ? 11 : feedback === 'hint' ? 10 : screen + 1
//   function navigate(next: number) { setScreen(next); setSelected(null); setFeedback(null); setAssessment(false) }
//   function submit() {
//     if (screen === 0) navigate(1)
//     else if (complete) setAssessment(true)
//     else if (feedback === 'hint') { setFeedback(null); setSelected(null) }
//     else if (feedback === 'correct') navigate(screen + 1)
//     else if (selected !== null) setFeedback(selected === step.correct ? 'correct' : 'hint')
//   }
//   return <main className="lesson-shell">
//     <header><span className="brand"><span aria-hidden="true">✦</span> PathFinder</span><span className="lesson-label">LESSON 5</span></header>
//     <nav aria-label="Lesson progress"><button className="back" aria-label="Go to previous step" disabled={screen === 0} onClick={() => feedback ? setFeedback(null) : navigate(screen - 1)}>‹</button><progress value={progress} max={11} aria-label="Lesson 5 progress"/><span>5 · {progress}/11</span></nav>
//     <section aria-labelledby="screen-title">
//       <p className="eyebrow">{complete ? 'Practice complete' : feedback === 'hint' ? 'When stuck' : screen === 0 ? 'Guided practice' : `Step ${String(screen).padStart(2, '0')}`}</p>
//       <h1 id="screen-title">{complete ? 'You’ve run Dijkstra’s!' : feedback === 'hint' ? 'Need a little help?' : screen === 0 ? 'Now it’s your turn' : step.title}</h1>
//       <p className="description">{complete ? 'You solved the graph from A to D.' : feedback === 'hint' ? 'Mistakes trigger explanations linked to the rule you missed.' : screen === 0 ? 'Solve a fresh weighted graph. We will guide you when needed.' : step.description}</p>
//       {screen === 0 ? <><WeightedGraph/><div className="info-card"><h2>The challenge</h2><p>Start at vertex A. Find the lowest-cost route to D using Dijkstra’s algorithm.</p></div><p className="helper">Observe → answer → check → learn from feedback.</p></> : complete ? <>
//         <div className="feedback-card success"><h2>✓ Well done!</h2><p>A → B → C → D costs 2 + 1 + 2 = 5.</p></div><div className="info-card tall"><h2>Final shortest path</h2><p>A → B → C → D</p><p>For independent assessment, you’ll solve an unfamiliar graph.</p></div>
//         {assessment && <p className="notice" role="status">Lesson 6 is not available yet. You’ve completed all of Lesson 5.</p>}
//       </> : feedback === 'hint' ? <><div className="feedback-card hint" role="alert"><h2>↻ Use the hint</h2><p>{step.hint}</p></div><div className="info-card tall"><h2>Try this rule</h2><p>Try again with the same graph. Use the explanation above to work through your answer.</p></div></> : <>
//         {step.active ? <><WeightedGraph active={step.active}/><h2 className="graph-question">{step.question}</h2></> : <div className="question-card"><h2>{step.question}</h2></div>}
//         <AnswerOptions options={step.options} selected={selected} onSelect={setSelected} disabled={feedback === 'correct'}/>
//         {feedback === 'correct' && <p className="correct" role="status">✓ {step.explanation}</p>}
//       </>}
//     </section>
//     <footer><button className="primary" disabled={screen > 0 && !complete && !feedback && selected === null} onClick={submit}>{screen === 0 ? 'Begin practice →' : complete ? 'Start assessment →' : feedback === 'hint' ? 'Try again ↻' : feedback === 'correct' ? 'Continue →' : 'Check answer'}</button>{complete && <button className="restart" onClick={() => navigate(0)}>Practise again</button>}</footer>
//   </main>
// }

import { useState, useEffect } from "react";
import { LessonHeader } from "./LessonHeader";
import { PageTitle } from "./PageTitle";
import { ProgressBar } from "./ProgressBar";
import { InfoCard } from "./InfoCard";
import { OptionCard } from "./OptionCard";
import { LessonButton } from "./Buttons";
import WeightedGraph from "./WeightedGraph";
import type { LessonData, LessonPage } from "../types/lesson";

interface Lesson5ExperienceProps {
  lesson: LessonData;
  onExit: () => void;
  onComplete?: () => void;
}

export function Lesson5Experience({ lesson, onExit, onComplete }: Lesson5ExperienceProps) {
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAssessmentNotice, setShowAssessmentNotice] = useState(false);

  const page: LessonPage = lesson.pages[index];
  const totalPages = lesson.pages.length;
  const isQuiz = page.type === "quiz";
  const isComplete = page.type === "complete";
  const contentBox = page.contentBox;

  useEffect(() => {
    setSelectedOptionId(null);
    setQuizChecked(false);
    setIsCorrect(null);
    setErrorMessage(null);
    setShowAssessmentNotice(false);
  }, [index]);

  function back() {
    if (index === 0) {
      onExit();
    } else {
      setIndex((prev) => Math.max(0, prev - 1));
    }
  }

  function handleNextClick() {
    if (isQuiz) {
      if (!quizChecked) {
        if (!selectedOptionId) {
          setErrorMessage("Choose an answer before checking.");
          return;
        }
        const correct = selectedOptionId === page.correctAnswerId;
        setIsCorrect(correct);
        setQuizChecked(true);
        setErrorMessage(null);
        return;
      } else {
        if (isCorrect) {
          if (index < totalPages - 1) {
            setIndex((prev) => prev + 1);
          } else if (onComplete) {
            onComplete();
          }
          return;
        } else {
          // Allow picking a different option and trying again
          setQuizChecked(false);
          setIsCorrect(null);
          setErrorMessage(null);
          return;
        }
      }
    }

    if (isComplete) {
      setShowAssessmentNotice(true);
      return;
    }

    if (index < totalPages - 1) {
      setIndex((prev) => prev + 1);
    } else if (onComplete) {
      onComplete();
    }
  }

  let buttonLabel = page.button || "Continue";
  if (isQuiz && quizChecked && isCorrect) {
    buttonLabel = "Continue →";
  } else if (isQuiz && quizChecked && !isCorrect) {
    buttonLabel = "Try again ↻";
  } else if (isComplete) {
    buttonLabel = "Start assessment →";
  }

  return (
    <div className="w-full min-h-screen bg-[#111116] text-slate-100 p-6 flex flex-col gap-6">
      <LessonHeader lessonNumber={lesson.meta.lessonNumber} onMenuClick={onExit} />

      <ProgressBar currentIndex={index} total={totalPages} onBack={back} />

      <div className="flex-1 flex flex-col gap-4" key={index}>
        <PageTitle
          category={page.eyebrow || lesson.meta.category}
          title={page.title}
          subtext={page.subtext}
        />

        {page.cardTitle && page.cardText && !isQuiz && (
          <InfoCard
            heading={page.cardTitle}
            body={page.cardText}
            variant={isComplete ? "green" : "default"}
          />
        )}

        {contentBox && contentBox.boxType === "weighted-graph" && (
          <WeightedGraph active={contentBox.active} />
        )}

        {/* Fallback support for steps that include a weighted graph without explicit contentBox */}
        {index === 1 || index === 2 || index === 6 ? (
          <WeightedGraph active={index === 2 || index === 6 ? "A" : index === 7 ? "B" : undefined} />
        ) : null}

        {isQuiz && (
          <div className="flex flex-col gap-4">
            {page.cardTitle && (
              <h3 className="text-sm font-bold text-slate-100">{page.cardTitle}</h3>
            )}

            <div className="flex flex-col gap-2.5" role="group" aria-label={page.cardTitle}>
              {page.options?.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  selected={selectedOptionId === option.id}
                  onClick={() => {
                    setSelectedOptionId(option.id);
                    setQuizChecked(false);
                    setIsCorrect(null);
                    setErrorMessage(null);
                  }}
                />
              ))}
            </div>

            {quizChecked && isCorrect && (
              <InfoCard
                heading="That's right!"
                body={page.correctFeedback || ""}
                variant="green"
              />
            )}

            {quizChecked && !isCorrect && (
              <InfoCard
                heading="↻ Use the hint"
                body={page.incorrectFeedback || ""}
                variant="red"
              />
            )}

            {errorMessage && (
              <InfoCard
                heading="Notice"
                body={errorMessage}
                variant="red"
              />
            )}
          </div>
        )}

        {showAssessmentNotice && (
          <p className="text-xs text-purple-400 font-medium" role="status">
            Lesson 6 is not available yet. You’ve completed all of Lesson 5.
          </p>
        )}

        {page.tipTitle && page.tipText && (!isQuiz || (quizChecked && isCorrect)) && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              {page.tipTitle}
            </span>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-mono">
              {page.tipText}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <LessonButton label={buttonLabel} onClick={handleNextClick} />
        {isComplete && (
          <button 
            className="text-xs text-slate-400 hover:text-slate-100 text-center py-2 bg-transparent border-0 cursor-pointer" 
            onClick={() => setIndex(0)}
          >
            Practise again
          </button>
        )}
      </div>
    </div>
  );
}