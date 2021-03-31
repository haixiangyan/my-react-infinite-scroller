import React from 'react'
import InfiniteScroll from './lib/InfiniteScroll'

const items = [
  'hello',
  'world',
  'xxx',
  'aaaa',
  'bbbb',
  'cccc',
  'ddd',
  'eee',
  'fff',
  'www',
  'qqq',
  'zzz',
  'ppp'
]

const App = () => {
  return (
    <div>
      <div style={{height: 100, overflow: 'auto', border: '1px solid red'}}>
        <InfiniteScroll
          throttle={300}
          loadMore={() => console.log('load more')}
          loader={<div className="loader" key={0}>Loading ...</div>}
        >
          {items.map(item => <div key={item}>{item}</div>)}
        </InfiniteScroll>
      </div>
    </div>
  )
}

export default App
