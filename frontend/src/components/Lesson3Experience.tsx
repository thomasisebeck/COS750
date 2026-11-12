import { useState } from "react";
import { ChevronLeft, ArrowRight, Check } from "lucide-react";
import { Logo } from "./Logo";
import { LessonHeader } from "./LessonHeader";
import { PageTitle } from "./PageTitle";
import { ProgressBar } from "./ProgressBar";
import { InfoCard } from "./InfoCard";
import { OptionCard } from "./OptionCard";
import { LessonButton } from "./Buttons";
import { WeightedGraph } from "./WeightedGraph";
import type { LessonData } from "../types/lesson";

interface Lesson3ExperienceProps {
  lesson: LessonData;
  onExit: () => void;
}

const FIRST_QUIZ_INDEX = 3;
const SECOND_QUIZ_INDEX = 5;
const RECOVERY_INDEX = 6;
const COMPLETION_INDEX = 7;

/** Lesson 03 refactored to standard Tailwind and modular shared components. */
export function Lesson3Experience({ lesson, onExit }: Lesson3ExperienceProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctAnswerChecked, setCorrectAnswerChecked] = useState(false);
  const [notice, setNotice] = useState("");
  const [recoveryOrigin, setRecoveryOrigin] = useState(SECOND_QUIZ_INDEX);

  const page = lesson.pages[pageIndex];
  const box = page.contentBox;
  const isQuiz = box.boxType === "graph-quiz";

  function moveTo(index: number) {
    setPageIndex(index);
    setSelectedOption(null);
    setCorrectAnswerChecked(false);
    setNotice("");
  }

  function goBack() {
    if (pageIndex === 0) {
      onExit();
    } else if (pageIndex === RECOVERY_INDEX) {
      moveTo(recoveryOrigin);
    } else if (pageIndex === COMPLETION_INDEX) {
      moveTo(SECOND_QUIZ_INDEX);
    } else {
      moveTo(pageIndex - 1);
    }
  }

  function goForward() {
    if (pageIndex === COMPLETION_INDEX) {
      onExit();
      return;
    }

    if (pageIndex === RECOVERY_INDEX) {
      moveTo(FIRST_QUIZ_INDEX);
      return;
    }

    if (isQuiz && !correctAnswerChecked) {
      if (!selectedOption) {
        setNotice("Choose an answer before checking.");
        return;
      }

      if (selectedOption !== box.correctAnswerId) {
        setRecoveryOrigin(pageIndex);
        moveTo(RECOVERY_INDEX);
        return;
      }

      setCorrectAnswerChecked(true);
      setNotice(
        pageIndex === FIRST_QUIZ_INDEX
          ? "Correct! The cheaper route costs 6, even though it uses more edges."
          : "Correct! 4 + 1 + 6 = 11."
      );
      return;
    }

    moveTo(pageIndex === SECOND_QUIZ_INDEX ? COMPLETION_INDEX : pageIndex + 1);
  }

  const buttonLabel =
    isQuiz && correctAnswerChecked ? "Continue" : page.buttonLabel;

  return (
    <div className="w-full min-h-screen bg-[#111116] text-slate-100 p-6 flex flex-col gap-6">
      {/* Top Header with 3 dots to return to menu */}
      <LessonHeader lessonNumber={3} onMenuClick={onExit} />

      {/* Progress Bar */}
      <ProgressBar
        currentIndex={pageIndex}
        total={lesson.pages.length}
        onBack={goBack}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4" key={pageIndex}>
        <PageTitle
          category={page.category ?? lesson.meta.category}
          title={page.title}
          subtext={page.subtext}
        />

        {box.boxType === "text" && (
          <InfoCard
            heading={box.title}
            body={
              pageIndex === RECOVERY_INDEX && recoveryOrigin === FIRST_QUIZ_INDEX
                ? "Read each weight along the chosen path. For A → C → B → D, calculate 2 + 1 + 3. Compare with A → B → D = 4 + 3."
                : box.text
            }
            variant={pageIndex === RECOVERY_INDEX ? "red" : "default"}
          />
        )}

        {(box.boxType === "graph" || box.boxType === "graph-quiz") && (
          <WeightedGraph
            nodes={box.state.nodes}
            edges={box.state.edges}
            highlightedNodeIds={box.state.highlightedNodes}
          />
        )}

        {isQuiz && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold text-slate-100">{box.question}</p>
            <div className="flex flex-col gap-2.5" role="group" aria-label={box.question}>
              {box.options.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  selected={selectedOption === option.id}
                  onClick={() => {
                    if (correctAnswerChecked) return;
                    setSelectedOption(option.id);
                    setNotice("");
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {page.extraBox && (
          <InfoCard
            heading={page.extraBox.title}
            body={page.extraBox.text}
          />
        )}

        {notice && (
          <InfoCard
            heading={correctAnswerChecked ? "Correct!" : "Notice"}
            body={notice}
            variant={correctAnswerChecked ? "green" : "red"}
          />
        )}
      </div>

      {/* Footer / Actions */}
      <div className="flex flex-col gap-2">
        <LessonButton label={buttonLabel} onClick={goForward} />
        {pageIndex === COMPLETION_INDEX && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
            <ArrowRight size={13} /> Lesson 04: Dijkstra's algorithm
          </div>
        )}
      </div>
    </div>
  );
}