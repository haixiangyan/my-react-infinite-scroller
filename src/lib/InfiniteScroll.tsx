import * as React from 'react'
import {Component, ReactNode} from 'react'

interface Props {
  loadMore: Function
  loader: ReactNode
  throttle: number
  getScrollParent?: () => HTMLElement
  useWindow?: boolean
}

class InfiniteScroll extends Component<Props, any> {
  private scrollComponent: HTMLDivElement | null = null // 当前滚动的组件
  private loadingMore = false // 是否正在加载更多

  constructor(props: Props) {
    super(props);
    this.scrollListener = this.scrollListener.bind(this)
  }

  scrollListener() {
    const node = this.scrollComponent
    if (!node) return

    const parentNode = this.getParentElement(node)
    if (!parentNode) return

    let offset;

    if (this.props.useWindow) {
      const doc = document.documentElement || document.body.parentElement || document.body
      const scrollTop = window.pageYOffset || doc.scrollTop

      offset = this.calculateOffset(node, scrollTop)
    } else {
      offset = node.scrollHeight - parentNode.scrollTop - parentNode.clientHeight
    }

    if (offset < this.props.throttle) {
      node.removeEventListener('scroll', this.scrollListener)

      this.props.loadMore()
      this.loadingMore = true
    }
  }

  calculateOffset(el: HTMLElement | null, scrollTop: number) {
    if (!el) return 0

    return this.calculateTopPosition(el) + el.offsetHeight - scrollTop - window.innerHeight
  }

  calculateTopPosition(el: HTMLElement | null): number {
    if (!el) return 0

    return el.offsetTop + this.calculateTopPosition(el.offsetParent as HTMLElement)
  }

  getParentElement(el: HTMLElement | null): HTMLElement | null {
    const scrollParent = this.props.getScrollParent && this.props.getScrollParent()

    if (scrollParent) {
      return scrollParent
    }

    return el && el.parentElement
  }

  attachScrollListener() {
    const parentElement = this.getParentElement(this.scrollComponent)

    if (!parentElement) return

    const scrollEl = this.props.useWindow ? window : parentElement

    scrollEl.addEventListener('scroll', this.scrollListener)
  }

  detachScrollListener() {
    const parentElement = this.getParentElement(this.scrollComponent)

    if (!parentElement) return

    parentElement.removeEventListener('scroll', this.scrollListener)
  }

  componentDidMount() {
    this.attachScrollListener()
  }

  componentWillUnmount() {
    this.detachScrollListener()
  }

  render() {
    const {children, loader} = this.props

    return (
      <div ref={node => this.scrollComponent = node}>
        {children}
        {loader}
      </div>
    )
  }
}

export default InfiniteScroll
