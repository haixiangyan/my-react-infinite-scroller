type AsyncFn = () => Promise<void>

export const delay = (asyncFn: AsyncFn) => new Promise<void>(resolve => {
  setTimeout(() => {
    asyncFn().then(() => resolve)
  }, 1500)
})
