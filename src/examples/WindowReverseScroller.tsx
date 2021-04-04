import React, {useEffect, useState} from 'react'
import InfiniteScroll from '../lib/InfiniteScroll'
import {delay} from './utils'

let counter = 0

const WindowReverseScroller = () => {
  const [items, setItems] = useState<string[]>([]);

  const fetchMore = async () => {
    await delay(async () => {
      const newItems = []

      for (let i = counter; i < counter + 150; i++) {
        newItems.push(`Counter: ${i} |||| ${new Date().toISOString()}`)
      }
      setItems([...items, ...newItems])

      counter += 150
    })
  }

  useEffect(() => {
    fetchMore().then()
  }, [])

  return (
    <div style={{border: '1px solid blue'}}>
      <InfiniteScroll
        useWindow
        isReverse
        threshold={300}
        loadMore={fetchMore}
        loader={<div className="loader" key={0}>Loading ...</div>}
      >
        {items.slice().reverse().map(item => <div key={item}>{item}</div>)}
      </InfiniteScroll>
    </div>
  )
}

export default WindowReverseScroller
