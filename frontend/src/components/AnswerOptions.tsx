type Props = { options: string[]; selected: number | null; disabled: boolean; onSelect: (index: number) => void }
export default function AnswerOptions({ options, selected, disabled, onSelect }: Props) {
  return <fieldset className="options" disabled={disabled}><legend className="sr-only">Choose your answer</legend>{options.map((option,index) => <label key={option} className={selected === index ? 'option selected' : 'option'}><input type="radio" name="answer" checked={selected === index} onChange={() => onSelect(index)}/><span>{option}</span></label>)}</fieldset>
}
