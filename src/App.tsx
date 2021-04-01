import React, {useEffect, useState} from 'react'
import InfiniteScroll from './lib/InfiniteScroll'

let counter = 0

const delay = (asyncFn: () => Promise<void>) => new Promise<void>(resolve => {
  setTimeout(() => {
    asyncFn().then(() => resolve)
  }, 1500)
})

const App = () => {
  const [items, setItems] = useState<string[]>([]);

  const fetchMore = async () => {
    await delay(async () => {
      const newItems = []

      for (let i = counter; i < counter + 50; i++) {
        newItems.push(`Counter: ${i} |||| ${new Date().toISOString()}`)
      }
      setItems([...items, ...newItems])

      counter += 50
    })
  }

  useEffect(() => {
    fetchMore().then()
  }, [])

  return (
    <div>
      <div style={{height: 250, overflow: 'auto', border: '1px solid red'}}>
        <InfiniteScroll
          throttle={50}
          loadMore={fetchMore}
          loader={<div className="loader" key={0}>Loading ...</div>}
        >
          {items.map(item => <div key={item}>{item}</div>)}
        </InfiniteScroll>
      </div>
    </div>
  )
}

export default App
