import * as React from 'react'
import {Component, ReactNode} from 'react'

interface EventListenerOptions {
  useCapture: boolean
  passive: boolean
}

interface Props {
  loadMore: (pageLoaded: number) => void // 加载更多的回调
  loader: ReactNode // 显示 Loading 的元素
  throttle?: number // offset 临界值，小于则开始加载
  isReverse?: boolean // 是否为相反的无限滚动
  hasMore?: boolean // 是否还有更多可以加载
  pageStart?: number // 页面初始页
  getScrollParent?: () => HTMLElement // 获取 parentElement 的回调
  useWindow?: boolean // 是否以 window 作为 scrollEl
  useCapture?: boolean // 是否注册为捕获事件
}

class InfiniteScroll extends Component<Props, any> {
  private scrollComponent: HTMLDivElement | null = null // 当前滚动的组件
  private loadingMore = false // 是否正在加载更多
  private pageLoaded = 0 // 当前加载页数
  private eventOptions = {} // 注册事件的选项
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
    useWindow: true,
    useCapture: false
  }

  constructor(props: Props) {
    super(props);
    this.getEventListenerOptions = this.getEventListenerOptions.bind(this)
    this.scrollListener = this.scrollListener.bind(this)
    this.mousewheelListener = this.mousewheelListener.bind(this)
  }

  isPassiveSupported() {
    let passive = false

    const testOptions = {
      get passive() {
        passive = true
        return true
      }
    }

    try {
      const testListener = () => {}
      document.addEventListener('test', testListener, testOptions)
      // @ts-ignore 仅用于测试是否可以使用 passive listener
      document.removeEventListener('test', testListener, testOptions)
    } catch (e) {}

    return passive
  }

  getEventListenerOptions() {
    const options: EventListenerOptions = {useCapture: this.props.useCapture || false, passive: false}

    if (this.isPassiveSupported()) {
      options.passive = true
    }

    return options
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
      this.detachListeners()
      this.beforeScrollTop = parentNode.scrollTop
      this.beforeScrollHeight = parentNode.scrollHeight

      if (this.props.loadMore) {
        this.props.loadMore(this.pageLoaded += 1)
        this.loadingMore = true
      }
    }
  }

  mousewheelListener(e: Event) {
    // 详见: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
    // @ts-ignore mousewheel 事件里存在 deltaY
    if (e.deltaY === 1 && !this.isPassiveSupported()) {
      e.preventDefault()
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

  attachListeners() {
    const parentElement = this.getParentElement(this.scrollComponent)

    if (!parentElement || !this.props.hasMore) return

    const scrollEl = this.props.useWindow ? window : parentElement

    scrollEl.addEventListener('scroll', this.scrollListener, this.eventOptions)
    scrollEl.addEventListener('resize', this.scrollListener, this.eventOptions)
    scrollEl.addEventListener('mousewheel', this.mousewheelListener, this.eventOptions)
  }

  detachMousewheelListener() {
    const scrollEl = this.props.useWindow ? window : this.scrollComponent?.parentElement

    if (!scrollEl) return

    scrollEl.removeEventListener('mousewheel', this.mousewheelListener, this.eventOptions)
  }

  detachListeners() {
    const scrollEl = this.props.useWindow ? window : this.getParentElement(this.scrollComponent)

    if (!scrollEl) return

    scrollEl.removeEventListener('scroll', this.scrollListener, this.eventOptions)
    scrollEl.removeEventListener('resize', this.scrollListener, this.eventOptions)
  }

  componentDidMount() {
    this.pageLoaded = this.props.pageStart || 0
    this.eventOptions = this.getEventListenerOptions()
    this.attachListeners()
  }

  componentDidUpdate() {
    if (this.props.isReverse && this.props.loadMore) {
      const parentElement = this.getParentElement(this.scrollComponent)

      if (parentElement) {
        parentElement.scrollTop = parentElement.scrollHeight - this.beforeScrollHeight + this.beforeScrollTop
        this.loadingMore = false
      }
    }
    this.attachListeners()
  }

  componentWillUnmount() {
    this.detachListeners()
    this.detachMousewheelListener()
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
