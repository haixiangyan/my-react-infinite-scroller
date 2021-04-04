import React, {useState} from 'react'
import DivScroller from './examples/DivScroller'
import WindowScroller from './examples/WindowScroller'
import DivReverseScroller from "./examples/DivReverseScroller";

type Pane = '1' | '2' | '3'

const App = () => {
  const [pane, setPane] = useState<Pane>('1');

  return (
    <div>
      <div>
        <button onClick={() => setPane('1')}>Div 向下无限滚动</button>
        <button onClick={() => setPane('2')}>Window 向下无限滚动</button>
        <button onClick={() => setPane('3')}>Div 向上无限滚动</button>
      </div>

      <div>
        {pane === '1' && <DivScroller/>}
        {pane === '2' && <WindowScroller/>}
        {pane === '3' && <DivReverseScroller/>}
      </div>
    </div>
  )
}

export default App
