# PathFinder — Graphs & Shortest Paths

A React + TypeScript + Vite pre-lecture learning prototype for **COS212**, prepared for the **COS750 educational software examination**. The design teaches graph structures and Dijkstra's algorithm to learners with **no assumed prior knowledge**.

## Running the project

From `frontend/` in PowerShell or a terminal with a current supported Node.js version:

```bash
npm ci
npm run dev
```

Open the local URL shown by Vite. Lessons 0–6, progress tracking, accessibility preferences and interactive graph exploration run in the browser without a backend (apart from optional high-quality narration). Use `npm run build` to create a production bundle.

### Tests

```bash
npm run test:logic   # pure-data, Dijkstra, generated question and continuity checks
npm test             # Vitest React interaction tests
npm run lint         # ESLint
npm run build        # TypeScript + Vite production build
```

**After extracting the ZIP, run `npm ci`** rather than copying an existing Windows `node_modules` folder. The project ZIP intentionally excludes `node_modules` and build artifacts.

## Progress and scoring fixes (15 November 2026)

- **Visible XP:** each distinct completed lesson contributes 100 XP; the total appears in the homepage hero and the achievements area. Replaying a lesson does not add XP twice.
- **Immediate achievement:** completing Lesson 6 awards its achievement when the assessment results open, even if Lessons 0–5 were skipped. Visiting Lesson 6 without finishing does not count. Existing saved results from the previous version can restore the achievement.
- **14 graded questions:** the assessment now has 14 actual questions across 18 screens (intro, questions, results, review, finish). The ranking, maximum, prize threshold and result all use the graded question count, not the number of screens.
- **Improved retakes:** a higher score replaces the locally stored best. Past 10-point scores remain preserved in their old key but are not mislabeled as 14-point results.
- **Practice-only rewards:** fictional competitors are beatable with 14/14. The R50 voucher is a proposed incentive, not redeemable.

See `docs/CHANGELOG_PROGRESS_SCORING_AUDIT.md` for detailed audit and verification.

## Earlier updates (14 November 2026)

- **One graph design throughout:** the existing Lesson 1 `LiveGraph` is now the shared visual system for all graph diagrams, including the interactive homepage graph. The old A → D hero label has been removed.
- **Quiz banks for every lesson:** optional Lesson 0 check; generated vertex and adjacency quizzes in Lesson 1; directed-edge variants in Lesson 2; retained JSON generators in Lessons 3 and 4; coherent generated weight-and-route practice in Lesson 5; an internally consistent fourteen-question generated assessment in Lesson 6. Related follow-up questions reuse the active graph.
- **Audio feedback:** stronger correct/incorrect answer cues plus the same Lesson 0 piano-style graph-interaction notes across all lessons. Both follow the sound toggle and adjustable feedback-volume slider.
- **Read aloud:** the Listen button first tries an optional private AI-generated narration endpoint and falls back to the best installed English browser voice. Configure `OPENAI_API_KEY` as described below to hear a more natural voice; no key is exposed to browsers. Voice quality without the endpoint still depends on the device.
- **Rewards:** 100 XP per unique completed lesson, persistent total and named achievements on the homepage.
- **Leaderboard:** five fictional classmates (top score 13/14). Your actual best result can beat them with a perfect 14/14. The **R50 voucher is an illustrative incentive, not a redeemable reward**.
- **Friendlier typography:** readable sans-serif instructional text and higher-contrast, light-coloured guidance panels.
- **Inclusive:** colour-independent textual/icon cues, keyboard graph selection, touch dragging, high contrast, reduced motion, optional audio, and optional narration.

See `docs/CHANGELOG_QUIZ_REWARDS_ACCESSIBILITY.md` for a detailed explanation and implementation mapping.

## Structure

- `src/components/Lesson0Experience.tsx` through `Lesson6Experience.tsx`: lesson screens.
- `src/components/LiveGraph.tsx`: shared graph visualization.
- `src/lessons/lesson-0.json` through `lesson-6.json`: lesson content.
- `src/lessons/lesson3Questions.ts`: weighted-graph question generation and follow-on continuity.
- `src/lessons/lesson4Questions.ts` and `src/algorithms/dijkstra.ts`: Dijkstra questions and pure algorithm trace.
- `src/lessons/questionBanks.ts`: computed quiz banks for other lessons.
- `src/lessons/rewards.ts`: practice leaderboard ordering and score tie rules.
- `src/components/SpeechButton.tsx`: natural narration with a browser-voice fallback.
- `src/components/Leaderboard.tsx`: fictional classmates plus the student's actual best local score.
- `docs/INSTRUCTIONAL_DESIGN.md`: ADDIE, theories, UDL, assessment alignment and GenAI disclosure draft.
- `docs/SOFTWARE_ENGINEERING.md`: requirements, architecture, implementation choices and verification checklist.

The documents are **editable drafts**; the project team needs to review and finalise them for formal submission. They reference the supplied COS750 lecture files and examination specification.

## Verification note

This update passed TypeScript, ESLint and **55 Node regression tests**. The React/Vitest suite and Vite bundling could not run in the editing environment because the uploaded Windows-oriented dependencies lack the Linux Rolldown binary and the npm registry was unavailable. Please rerun `npm ci`, `npm test` and `npm run build` on your machine before the presentation.

## Natural voice option (server-side only)

Without any setup, **Listen** uses an English voice installed on the student's phone or computer. For more expressive, tutor-like speech, add a private API key for the optional speech endpoint:

1. Copy `.env.example` to `.env.local` inside `frontend` and set `OPENAI_API_KEY` (keep this file private).
2. Run `npm run dev` normally. Vite serves `/api/tts` privately using that server-side key.
3. For Vercel deployment, configure `OPENAI_API_KEY` in the server's Environment Variables; `api/tts.ts` serves the route. GitHub Pages is static-only and will use the browser-voice fallback.

The audio produced by the optional provider is AI-generated. This is a provider-billed feature; never put the credential in `VITE_` variables or frontend source. The Speech API model currently configured is scheduled to retire in January 2027, so plan to upgrade the service before that date. A public production deployment additionally needs authentication and rate limits.

See `docs/CHANGELOG_GRAPH_AND_VOICE.md` for the exact layout, piano and leaderboard changes.
