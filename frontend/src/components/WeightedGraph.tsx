export default function WeightedGraph({ active }: { active?: string }) {
  return <div className="graph-card"><svg viewBox="0 0 276 210" role="img" aria-label="Weighted graph: A–B 2, A–C 5, B–C 1, B–D 6, C–D 2">
    <path className="edges" d="M38 112L128 36L238 110L132 174L38 112 M128 36L132 174" />
    <g className="weights"><text x="76" y="73">2</text><text x="80" y="146">5</text><text x="121" y="105">1</text><text x="179" y="73">6</text><text x="183" y="145">2</text></g>
    {([{name:'A',x:38,y:112},{name:'B',x:128,y:36},{name:'C',x:132,y:174},{name:'D',x:238,y:110}]).map(({name,x,y}) => <g key={name} className={active === name ? 'vertex active' : 'vertex'}><circle cx={x} cy={y} r="16"/><text x={x} y={y} dy=".35em">{name}</text></g>)}
  </svg></div>
}

