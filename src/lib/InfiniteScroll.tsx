import * as React from 'react'
import {Component, ReactNode} from 'react'

interface Props {
  loadMore: (pageLoaded: number) => void // 加载更多的回调
  loader: ReactNode // 显示 Loading 的元素
  throttle?: number // offset 临界值，小于则开始加载
  isReverse?: boolean // 是否为相反的无限滚动
  hasMore?: boolean // 是否还有更多可以加载
  pageStart?: number // 页面初始页
  getScrollParent?: () => HTMLElement // 获取 parentElement 的回调
  useWindow?: boolean // 是否以 window 作为 scrollEl
}

class InfiniteScroll extends Component<Props, any> {
  private scrollComponent: HTMLDivElement | null = null // 当前滚动的组件
  private loadingMore = false // 是否正在加载更多
  private pageLoaded = 0 // 当前加载页数
  // isReverse 后专用参数
  private beforeScrollTop = 0 // 上次滚动时 parentNode 的 scrollTop
  private beforeScrollHeight = 0 // 上次滚动时 parentNode 的 scrollHeight

  // 默认 props
  static defaultProps = {
    throttle: 300,
    isReverse: false,
    hasMore: true,
    pageStart: 0,
    getScrollParent: null,
    useWindow: true
  }

  constructor(props: Props) {
    super(props);
    this.scrollListener = this.scrollListener.bind(this)
  }

  scrollListener() {
    const el = this.scrollComponent
    if (!el) return

    const parentNode = this.getParentElement(el)
    if (!parentNode) return

    let offset;

    if (this.props.useWindow) {
      const doc = document.documentElement || document.body.parentNode || document.body
      const scrollTop = window.pageYOffset || doc.scrollTop

      offset = this.props.isReverse ? scrollTop : this.calculateOffset(el, scrollTop)
    } else if (this.props.isReverse) {
      offset = parentNode.scrollTop
    } else {
      offset = el.scrollHeight - parentNode.scrollTop - parentNode.clientHeight
    }

    if (offset < (this.props.throttle || 300)) {
      this.detachScrollListener()
      this.beforeScrollTop = parentNode.scrollTop
      this.beforeScrollHeight = parentNode.scrollHeight

      if (this.props.loadMore) {
        this.props.loadMore(this.pageLoaded += 1)
        this.loadingMore = true
      }
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

    if (!parentElement || !this.props.hasMore) return

    const scrollEl = this.props.useWindow ? window : parentElement

    scrollEl.addEventListener('scroll', this.scrollListener)
    scrollEl.addEventListener('resize', this.scrollListener)
  }

  detachScrollListener() {
    const scrollEl = this.props.useWindow ? window : this.getParentElement(this.scrollComponent)

    if (!scrollEl) return

    scrollEl.removeEventListener('scroll', this.scrollListener)
    scrollEl.removeEventListener('resize', this.scrollListener)
  }

  componentDidMount() {
    this.attachScrollListener()
    this.pageLoaded = this.props.pageStart || 0
  }

  componentDidUpdate() {
    if (this.props.isReverse && this.props.loadMore) {
      const parentElement = this.getParentElement(this.scrollComponent)

      if (parentElement) {
        parentElement.scrollTop = parentElement.scrollHeight - this.beforeScrollHeight + this.beforeScrollTop
        this.loadingMore = false
      }
    }
    this.attachScrollListener()
  }

  componentWillUnmount() {
    this.detachScrollListener()
  }

  render() {
    const {children, loader, hasMore, isReverse} = this.props

    const childrenArray = [children]

    if (hasMore && loader) {
      isReverse ? childrenArray.unshift(loader) : childrenArray.push(loader)
    }

    return (
      <div ref={node => this.scrollComponent = node}>
        {childrenArray}
      </div>
    )
  }
}

export default InfiniteScroll
