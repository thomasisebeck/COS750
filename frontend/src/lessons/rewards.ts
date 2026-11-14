/** These entries exist fictional practice scores for the COS750 prototype. */
export const practiceLeaderboard = [
  { name: "Lerato", score: 9 }, { name: "Musa", score: 8 },
  { name: "Anele", score: 8 }, { name: "Kabelo", score: 7 }, { name: "Zoe", score: 6 },
];
export function rankAssessment(userScore: number, total = 10) {
  const normalized = Math.max(0,Math.min(10,Math.round(userScore / Math.max(1,total) * 10)));
  const ranks = [
    ...practiceLeaderboard.map(entry => ({...entry,mock:true})),
    {name:"You",score:normalized,mock:false},
  ].sort((a,b) => b.score-a.score || Number(b.mock)-Number(a.mock));
  const firstPlace = ranks[0].name === "You" && normalized > practiceLeaderboard[0].score;
  return {ranks,firstPlace};
}
