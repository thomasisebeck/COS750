/** XP is derived from unique completed lesson IDs: replaying cannot farm XP. */
export const XP_PER_LESSON = 100;
export const LESSON_IDS = [0, 1, 2, 3, 4, 5, 6] as const;

export function normalizeCompletedLessons(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const valid = new Set<number>(LESSON_IDS);
  return [...new Set(value.filter((id): id is number => typeof id === "number" && valid.has(id)))].sort((a, b) => a - b);
}

export function totalExperience(completedLessonIds: readonly number[]): number {
  return normalizeCompletedLessons(completedLessonIds).length * XP_PER_LESSON;
}

/** Fictional classmates start below a perfect result, whatever the assessment length. */
export const practiceLeaderboard = [
  { name: "Lerato", behind: 1 }, { name: "Musa", behind: 2 },
  { name: "Anele", behind: 2 }, { name: "Kabelo", behind: 3 },
  { name: "Zoe", behind: 4 },
];

export function rankAssessment(userScore: number | null, total: number) {
  const maxScore = Math.max(1, Math.trunc(Number.isFinite(total) ? total : 1));
  const normalized = userScore === null || !Number.isFinite(userScore)
    ? null : Math.max(0, Math.min(maxScore, Math.trunc(userScore)));
  const ranks = [
    ...practiceLeaderboard.map(entry => ({name:entry.name,score:Math.max(0,maxScore-entry.behind),mock:true})),
    ...(normalized === null ? [] : [{name:"You",score:normalized,mock:false}]),
  ].sort((a,b) => b.score-a.score || Number(b.mock)-Number(a.mock));
  const firstPlace = normalized !== null && ranks[0]?.name === "You" && normalized > Math.max(0,maxScore-1);
  return {ranks,firstPlace};
}
