import { useState } from "react";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { Logo } from "./logo";
import { InfoCard } from "./infoCard";
import { OptionCard } from "./optionCard";
import { LessonButton } from "./buttons";
import { WeightedGraph } from "./WeightedGraph";
import type { LessonData } from "../types/lesson";
import "./lesson3.css";

interface Lesson3ExperienceProps {
  lesson: LessonData;
  onExit: () => void;
}

const FIRST_QUIZ_INDEX = 3;
const SECOND_QUIZ_INDEX = 5;
const RECOVERY_INDEX = 6;
const COMPLETION_INDEX = 7;

/** Lesson 03 is built from the existing JSON page format and shared UI cards. */
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
      // Return to the earlier two-edge comparison to scaffold the concept.
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
    isQuiz && correctAnswerChecked
      ? "Continue"
      : page.buttonLabel;

  return (
    <main className="l3-viewport">
      <section className="l3-screen" aria-label="Lesson 3: Weigh Your Options">
        <header className="l3-topbar">
          <Logo />
          <span>LESSON 3</span>
        </header>

        <nav className="l3-progress-row" aria-label="Lesson progress">
          <button
            type="button"
            aria-label={pageIndex === 0 ? "Back to learning path" : "Previous step"}
            className="l3-back"
            onClick={goBack}
          >
            <ChevronLeft size={17} strokeWidth={1.7} />
          </button>
          <div
            role="progressbar"
            aria-valuenow={pageIndex + 1}
            aria-valuemin={1}
            aria-valuemax={lesson.pages.length}
            aria-label="Lesson steps completed"
            className="l3-progress-track"
          >
            <span style={{ width: `${((pageIndex + 1) / lesson.pages.length) * 100}%` }} />
          </div>
          <span className="l3-progress-label">3 · {pageIndex + 1}/{lesson.pages.length}</span>
        </nav>

        <div className="l3-content" key={pageIndex}>
          <div className="l3-heading">
            <span className="l3-eyebrow">{page.category ?? lesson.meta.category}</span>
            <h1>{page.title}</h1>
            <p>{page.subtext}</p>
          </div>

          {box.boxType === "text" && (
            <InfoCard
              heading={box.title}
              body={pageIndex === RECOVERY_INDEX && recoveryOrigin === FIRST_QUIZ_INDEX
                ? "Read each weight along the chosen path. For A → C → B → D, calculate 2 + 1 + 3. Compare with A → B → D = 4 + 3."
                : box.text}
              variant={pageIndex === RECOVERY_INDEX ? "red" : "default"}
              className={`l3-info-card l3-primary-card ${pageIndex === 0 ? "l3-intro-card" : ""} ${pageIndex === 2 || pageIndex === 4 ? "l3-tall-card" : ""} ${pageIndex === RECOVERY_INDEX ? "l3-error-card" : ""}`}
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
            <div className="l3-quiz">
              <p className="l3-question">{box.question}</p>
              <div className="l3-options" role="group" aria-label={box.question}>
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
                    className={`l3-option ${correctAnswerChecked ? "l3-locked-option" : ""}`}
                  />
                ))}
              </div>
            </div>
          )}

          {page.extraBox && (
            <InfoCard
              heading={page.extraBox.title}
              body={page.extraBox.text}
              className="l3-info-card l3-takeaway"
            />
          )}

          {notice && (
            <p
              className={`l3-notice ${correctAnswerChecked ? "l3-notice-success" : ""}`}
              role="status"
              aria-live="polite"
            >
              {notice}
            </p>
          )}
        </div>

        <footer className="l3-footer">
          <LessonButton
            label={buttonLabel}
            onClick={goForward}
            className="l3-continue-button"
            showArrow={!isQuiz || correctAnswerChecked}
          />
          {pageIndex === COMPLETION_INDEX && (
            <span className="l3-footnote"><ArrowRight size={13} /> Lesson 04: Dijkstra's algorithm</span>
          )}
        </footer>
      </section>
    </main>
  );
}
