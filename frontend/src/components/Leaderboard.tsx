import { Award, Crown, Gift, Medal, Trophy } from "lucide-react";
import { rankAssessment } from "../lessons/rewards";

export function Leaderboard({ userScore = null, total, compact = false }: {
  userScore?: number | null; total: number; compact?: boolean;
}) {
  const {ranks:ranking,firstPlace:winning} = rankAssessment(userScore,total);
  return <section className={`pf-leaderboard ${compact ? "is-compact" : ""}`} aria-label="Assessment leaderboard">
    <header className="pf-leaderboard-head"><span className="pf-reward-icon"><Trophy size={21}/></span><div><span className="pf-eyebrow">FINAL ASSESSMENT</span><h2>Leaderboard</h2><p>Beat the practice scores and climb the board.</p></div></header>
    <div className="pf-voucher-banner"><Gift size={22}/><div><strong>R50 voucher challenge</strong><small>{winning ? "You reached first place!" : `Score ${total}/${total} to take first place`}</small></div></div>
    <ol className="pf-ranking">{ranking.slice(0,6).map((entry,index) => <li key={entry.name} className={!entry.mock ? "is-you" : ""}>
      <span className="pf-rank-number">{index === 0 ? <Crown size={17}/> : `${index+1}`}</span>
      <span className="pf-rank-name">{entry.name}{!entry.mock && <small> · Your score</small>}</span><strong>{entry.score}<small> / {total}</small></strong>
      {index === 0 && <Medal size={17} className="pf-rank-medal" aria-label="First place"/>}
    </li>)}</ol>
    {userScore === null && <p className="pf-first-attempt">Your place appears after you finish the assessment.</p>}
    <p className="pf-practice-note"><Award size={14} aria-hidden="true"/> Practice scores are fictional. The R50 voucher is a proposed prize and cannot be redeemed.</p>
  </section>;
}
