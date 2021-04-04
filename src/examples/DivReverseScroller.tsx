import React, {useEffect, useState} from 'react'
import InfiniteScroll from '../lib/InfiniteScroll'
import {delay} from './utils'

let counter = 0

const DivReverseScroller = () => {
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
    <div style={{height: 250, overflow: 'auto', border: '1px solid red'}}>
      <InfiniteScroll
        isReverse
        useWindow={false}
        threshold={50}
        loadMore={fetchMore}
        loader={<div className="loader" key={0}>Loading ...</div>}
      >
        {items.slice().reverse().map(item => <div key={item}>{item}</div>)}
      </InfiniteScroll>
    </div>
  )
}

export default DivReverseScroller
