import { useState } from 'react'

export default function Example() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Count is {count}</button>
}
