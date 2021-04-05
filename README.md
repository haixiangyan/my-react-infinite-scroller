# 造一个 react-infinite-scroller 轮子

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/037c57bcf4f54845943e9309ef3251db~tplv-k3u1fbpfcp-zoom-1.image)

**无限滚动**是一个开发时经常遇到的问题，比如 ant-design 的 List 组件里就推荐使用 [react-infinite-scroller](https://www.npmjs.com/package/react-infinite-scroller) 配合 List 组件一起使用。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a0a2395b60bf41438c930b83a5bfa439~tplv-k3u1fbpfcp-zoom-1.image)

假如我们想自己实现无限滚动，难免要去查 `scroll` 事件，还要搞清 `offsetHeight`, `scrollHeight`, `pageX` 这些奇奇怪怪变量之间的关系，真让人脑袋大。今天就带大家造一个 reac-infinite-scroller 的轮子吧。

## offset 公式

无限滚动的原理很简单：只要 `很长元素总高度 - 窗口距离顶部高度 - 窗口高度 < 阈值` 就加载更多，前面那一堆下称为 `offset`，表示**还剩多少 px 到达底部**。

然后就懵逼了：`scrollY`, `pageY`, `scrollTop`, `offsetTop`, `clientHeight` 这一堆的变量到底用哪个来计算呢？对于大部分人来说，这些变量简直是噩梦一般的存在，总是会傻傻搞不清。

这里直接给出计算 offset 的公式，免得大家去查了：

```ts
const offset = 很长元素总高度 - 窗口距离顶部高度 - 窗口高度 = node.scrollHeight - parentNode.scrollTop - parentNode.clientHeight

if (offset < this.props.threshold) {
     private pageLoaded = 0 // 当前加载页数
}
```

简单说一下这些变量都是个啥：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/882a4a0c1c0444ba9f8bdcf723b2903f~tplv-k3u1fbpfcp-zoom-1.image)

* **[scrollHeight](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollHeight): 这个只读属性是一个元素的内容高度，包括由于溢出导致的视图中不可见内容。相当于上面的 “很长元素总高度”**
* **[scrollTop](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollTop):  可以获取或设置一个元素的内容垂直滚动的像素数。相当于上面的 “窗口距离顶部的高度”**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/110cb6ebde8549f488a67432caa26907~tplv-k3u1fbpfcp-zoom-1.image)

* **[clientHeight](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/clientWidth): 仅仅包括 padding 的元素高度。相当于上面的 “窗口高度”**

总结一下，上面公式里的 `offset` 表示距离底部的 px 值，只要 `offset < threshold` 说明滚动到了底部，开始 `loadMore()`。

## 最小实现

下面为使用用例，定义 delay 函数用于 mock 延时效果，`fetchMore` 为获取更多数据的函数。

```ts
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
```

轮子最简单的实现如下：

```ts
interface Props {
  loadMore: Function // 加载更多的回调
  loader: ReactNode // “加载更多”的组件
  threshold: number // 到达底部的阈值
  hasMore?: boolean // 是否还有更多可以加载
  pageStart?: number // 页面初始页
}

class InfiniteScroll extends Component<Props, any> {
  private scrollComponent: HTMLDivElement | null = null // 当前很很长的内容
  private loadingMore = false // 是否正在加载更多
  private pageLoaded = 0 // 当前加载页数

  constructor(props: Props) {
    super(props);
    this.scrollListener = this.scrollListener.bind(this) // scrollListener 用到了 this，所以要 bind 一下
  }

  // 滚动监听顺
  scrollListener() {
    const node = this.scrollComponent
    if (!node) return

    const parentNode = node.parentElement
    if (!parentNode) return

    // 核心计算公式
    const offset = node.scrollHeight - parentNode.scrollTop - parentNode.clientHeight

    if (offset < this.props.threshold) {
      parentNode.removeEventListener('scroll', this.scrollListener) // 加载的时候去掉监听器

      this.props.loadMore(this.pageLoaded += 1) // 加载更多
      this.loadingMore = true // 正在加载更多
    }
  }

  componentDidMount() {
    this.pageLoaded = this.props.pageStart || 0
    // Mount 的时候就添加监听器
    if (this.scrollComponent && this.scrollComponent.parentElement) {
      this.scrollComponent.parentElement.addEventListener('scroll', this.scrollListener)
    }
  }

  componentDidUpdate() {
    // 到达底部时会把监听器临时移除，组件更新的时候，这里再加回来
    if (this.scrollComponent && this.scrollComponent.parentElement) {
      this.scrollComponent.parentElement.addEventListener('scroll', this.scrollListener)
    }
  }

  componentWilUnmount() {
    // Mount 的时候就添加监听器
    if (this.scrollComponent && this.scrollComponent.parentElement) {
      this.scrollComponent.parentElement.addEventListener('scroll', this.scrollListener)
    }
  }

  render() {
    const {children, loader} = this.props

    // 获取滚动元素的核心代码
    return (
      <div ref={node => this.scrollComponent = node}>
        {children} 很长很长很长的东西
        {loader} “加载更多”
      </div>
    )
  }
}
```

上面就是一个最小实现，有以下注意点：
* scrollListener 用到了 this，所以要 `bind` this，不然 this 为 `undefined`
* parentElement 上添加/移除监听器
* 组件 mount 的时候添加监听器，`offset < threshold` 的时候移除监听器，组件更新后再次添加监听器，unmount 前移除监听器

上面添加/移除监听器的代码有点冗余，封装一下：

```ts
class InfiniteScroll extends Component<Props, any> {
  ...

  // 滚动监听顺
  scrollListener() {
    const node = this.scrollComponent
    if (!node) return

    const parentNode = node.parentElement
    if (!parentNode) return

    // 核心计算公式
    const offset = node.scrollHeight - parentNode.scrollTop - parentNode.clientHeight

    if (offset < this.props.threshold) {
      this.detachScrollListener() // 加载的时候去掉监听器

      this.props.loadMore(this.pageLoaded += 1) // 加载更多
      this.loadingMore = true // 正在加载更多
    }
  }

  getParentElement(el: HTMLElement | null): HTMLElement | null {
    return el && el.parentElement
  }

  attachScrollListener() {
    const parentElement = this.getParentElement(this.scrollComponent)

    if (!parentElement) return

    const scrollEl = this.props.useWindow ? window : parentElement

    scrollEl.addEventListener('scroll', this.scrollListener)
    scrollEl.addEventListener('resize', this.scrollListener)
  }

  detachScrollListener() {
    const parentElement = this.getParentElement(this.scrollComponent)

    if (!parentElement) return

    parentElement.removeEventListener('scroll', this.scrollListener)
    parentElement.removeEventListener('resize', this.scrollListener)
  }

  componentDidMount() {
    this.attachScrollListener()
  }
  componentDidUpdate() {
    this.attachScrollListener()
  }
  componentWillUnmount() {
    this.detachScrollListener()
  }

  render() {
    const {children, loader} = this.props

    // 获取滚动元素的核心代码
    return (
      <div ref={node => this.scrollComponent = node}>
        {children} 很长很长很长的东西
        {loader} “加载更多”
      </div>
    )
  }
}
```

上面首先将获取 `parentElement` 的动作抽象出来，再把 `attachScrollListener` 和 `detachScrollListener` 抽象出来。同时，上面还对 resize 事件绑定了监听器，因为当用户 resize 的时候也会出现 `offset < threshold` 的可能，这个时候也需要 `loadMore`。

还有一个问题：刚进页面的时候，高度为 0，假如此时 `offset < threshold` 理应触发“加载更多”，然而这个时候用户并没有做任何滚动，滚动事件不会被触发，“加载更多”也不会被触发，这其实并不符合我们的预期。

因此，这里可以加一个 `initialLoad` 的 props 指定添加监听器的时候就自动触发一次监听器的代码。

```ts
interface Props {
  ...
  initialLoad?: boolean // 是否第一次就加载
}

class InfiniteScroll extends Component<Props, any> {
  ...

  attachListeners() {
    const parentElement = this.getParentElement(this.scrollComponent)

    if (!parentElement) return

    parentElement .addEventListener('scroll', this.scrollListener, this.eventOptions)
    parentElement .addEventListener('resize', this.scrollListener, this.eventOptions)

    if (this.props.initialLoad) {
      this.scrollListener()
    }
  }
}
```

## useWindow

上面对 `parentElement` 的限制是比较死的，可以添加 `getParentElement` 这个 props 让开发者自己指定 `parentElement`，这样轮子就会更灵活些。

```ts
interface Props {
  loadMore: Function
  loader: ReactNode
  threshold: number
  getScrollParent?: () => HTMLElement
}

class InfiniteScroll extends Component<Props, any> {
  ...

  getParentElement(el: HTMLElement | null): HTMLElement | null {
    const scrollParent = this.props.getScrollParent && this.props.getScrollParent()

    if (scrollParent) {
      return scrollParent
    }

    return el && el.parentElement
  }

  ...
}
```

此时们不禁想到，要是开发者想传 `document.body` 作为 `parentElement`，上面的代码还能继续使用么？当然是不行的。`document.body` 和很长很长的元素往往存在很多层嵌套，这些复杂的嵌套关系有时候并不会是我们希望的那样。

而在全局 (window) 做无限滚动的例子又比较常见，为了实现全局滚动的功能，这里加一个 `useWindow` props 来表示是否用 `window` 作为滚动的容器。

```ts
interface Props {
  ...
  getScrollParent?: () => HTMLElement // 获取 parentElement 的回调
  useWindow?: boolean // 是否以 window 作为 scrollEl
}
```

如果用全局作为滚动容器，我们需要另一套算计方法来算 `offset` 了，下面给出新的计算公式：

```ts
offset =  很长元素总高度 - 窗口距离顶部高度 - 窗口高度 = (当前窗口顶部与很长元素顶部的距离 + offsetHeight) - window.pageYOffset - window.innerHeight
```

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/81ee1d678375421cad2e3c9929781fc9~tplv-k3u1fbpfcp-zoom-1.image)

* [offsetHeight](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLElement/offsetWidth):  是一个只读属性，返回一个元素的布局高度
* [window.pageYOffset](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/scrollY): 其实就是 scrollY 的别名，返回文档在垂直方向已滚动的像素值
* [window.innerHeight](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/innerHeight): 为浏览器窗口的视口的高度

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/31ab27f937b34b35ba9e97a216006392~tplv-k3u1fbpfcp-zoom-1.image)

上面公式里“当前窗口顶部与很长元素顶部的距离 + offsetHeigh”在页面里是定死的，而 `window.pageYOffset - window.innerHeight` 会随着滚动而改变，两者相减则为 `offset`。图示：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a7c940a2f33f40e5a313419e4e0e9c15~tplv-k3u1fbpfcp-zoom-1.image)

**不过，这里的 “当前窗口顶部与很长元素顶部的距离” 这一步并不能通过变量来获得，只能用 JS 来获取：**

```ts
  // 元素顶部到页面顶部的距离
  calculateTopPosition(el: HTMLElement | null): number {
    if (!el) return 0

    return el.offsetTop + this.calculateTopPosition(el.offsetParent as HTMLElement)
  }
```

利用 `calculateTopPosition` 函数，计算 `offset` 的函数为：

```ts
  // 计算 offset
  calculateOffset(el: HTMLElement | null, scrollTop: number) {
    if (!el) return 0

    return this.calculateTopPosition(el) + (el.offsetHeight - scrollTop - window.innerHeight)
  }
```

整理上面函数到轮子里：

```ts
class InfiniteScroll extends Component<Props, any> {
  ...

  scrollListener() {
    const node = this.scrollComponent
    if (!node) return

    const parentNode = this.getParentElement(node)
    if (!parentNode) return

    let offset;

    if (this.props.useWindow) {
      const doc = document.documentElement || document.body.parentElement || document.body // 全局滚动容器
      const scrollTop = window.pageYOffset || doc.scrollTop // 全局的 "scrollTop"

      offset = this.calculateOffset(node, scrollTop)
    } else {
      offset = node.scrollHeight - parentNode.scrollTop - parentNode.clientHeight
    }

    if (offset < this.props.throttle) {
      node.removeEventListener('scroll', this.scrollListener)

      this.props.loadMore(this.pageLoaded += 1)
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

  attachScrollListener() {
    const parentElement = this.getParentElement(this.scrollComponent)

    if (!parentElement) return

    const scrollEl = this.props.useWindow ? window : parentElement

    scrollEl.addEventListener('scroll', this.scrollListener)
  }

  detachScrollListener() {
    const parentElement = this.getParentElement(this.scrollComponent)

    if (!parentElement) return

    const scrollEl = this.props.useWindow ? window : parentElement

    scrollEl .removeEventListener('scroll', this.scrollListener)
  }

  ...
}
```

上面改动的点有：
1. 添加和移除监听器时，如果 `useWindow === true`，以 `window` 为 `scrollEl`
2. 添加计算 topPosition 和 offset 的函数: `calculateTopPosition` 和 `calculateOffset`
3. 监听器里判断是否 `useWindow`，如果 `true`，使用上面的 `calculateOffset` 计算 offset

至此，无限滚动最核心的滚动已经实现了。

## isReverse

除了向下无限滚动，我们还要考虑无限向上滚动的情况。有人就会问了：一般都是无限向下的呀，哪来的无限向上？很简单，翻找微信的聊天记录不就是无限向上滚动的嘛。

首先，在 props 加一个 `isReverse` 用于指定向下还是向上无限滚动。

```ts
interface Props {
  ...
  isReverse?: boolean // 是否为相反的无限滚动
}
```

那 `isReverse` 会影响哪个部分呢？第一反应肯定是 `loader` 的位置变了：

```ts
  render() {
    const {children, loader, isReverse} = this.props

    const childrenArray = [children]

    if (loader) {
      // 根据 isReverse 改变 loader 的插入方式
      isReverse ? childrenArray.unshift(loader) : childrenArray.push(loader)
    }

    return (
      <div ref={node => this.scrollComponent = node}>
        {childrenArray}
      </div>
    )
  }
```

然后 `offset` 的计算也要变了。对于向上无限滚动，`offset` 的计算反而变简单了，直接 `offset = scrollTop`。在 `scrollListener` 里修改 `offset`  的计算：

```ts
  scrollListener() {
    const el = this.scrollComponent
    if (!el) return

    const parentElement = this.getParentElement(el)
    if (!parentElement) return

    let offset;

    if (this.props.useWindow) {
      const doc = document.documentElement || document.body.parentElement || document.body
      const scrollTop = window.pageYOffset || doc.scrollTop

      offset = this.props.isReverse ? scrollTop : this.calculateOffset(el, scrollTop)
    } else {
      offset = this.props.isReverse
        ? parentElement.scrollTop
        : el.scrollHeight - parentElement.scrollTop - parentElement.clientHeight
    }

    // 是否到达阈值，是否可见
    if (offset < (this.props.threshold || 300) && (el && el.offsetParent !== null)) {
      this.detachListeners()
      this.beforeScrollHeight = parentElement.scrollHeight
      this.beforeScrollTop = parentElement.scrollTop

      if (this.props.loadMore) {
        this.props.loadMore(this.pageLoaded += 1)
        this.loadingMore = true
      }
    }
  }
```

我们还要考虑一个问题：向上滚动加载更多内容后，滚动条的位置不应该还停留在 scrollY = 0 的位置，不然会一直加载更多，比如此时滚动到了顶部：

```
3 <- 到顶部了，开始加载
2
1
0
```

加载更多后

```
6 <- 不应该停留在这个位置，因为会再次触发无限滚动，用户体验不友好
5
4
3 <- 应该停留在原始的位置，用户再向上滚动才再次加载更多
2
1
0
```

为了达到这个效果，我们要记录上一次的 `scrollTop` 和 `scrollHeight`，然后在组件更新的时候更新 `parentElemnt.scrollTop`：

```ts
// 当前 scrollTop = 当前 scrollHeight - 上一次的 scrollHeight + 上一交的 scrollTop
parentElement.scrollTop = parentElement.scrollHeight - this.beforeScrollHeight + this.beforeScrollTop
```

以上面的例子举例：
* parentElement.scrollHeight: 6 - 0 的高度
* beforeScrollHeight: 3 - 0 的高度
* beforeScrollTop: 高度为 0

最后更新 `parentElement.scrollTop` 为 3 - 0 的高度，滚动条会停留在 3 这个位置。

实现时，首先声明 `beforeScrollHeight` 和 `beforeScrollTop`，并在 `scrollListener` 里进行赋值：

```ts
class InfiniteScroll extends Component<Props, any> {
  ...
  // isReverse 后专用参数
  private beforeScrollTop = 0 // 上次滚动时 parentNode 的 scrollTop
  private beforeScrollHeight = 0 // 上次滚动时 parentNode 的 scrollHeight

  ...

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
      this.beforeScrollTop = parentNode.scrollTop // 记录上一次的 scrollTop
      this.beforeScrollHeight = parentNode.scrollHeight // 记录上一次的 scrollHeight

      if (this.props.loadMore) {
        this.props.loadMore(this.pageLoaded += 1)
        this.loadingMore = true
      }
    }
  }

  ...
}
```

然后在 `componentDidUpdate` 里计算并更新滚动条的位置：

```ts
  componentDidUpdate() {
    if (this.props.isReverse && this.props.loadMore) {
      const parentElement = this.getParentElement(this.scrollComponent)

      if (parentElement) {
        // 更新滚动条的位置
        parentElement.scrollTop = parentElement.scrollHeight - this.beforeScrollHeight + this.beforeScrollTop
        this.loadingMore = false
      }
    }
    this.attachScrollListener()
  }
```

至此，向上滚动也被我们实现了。

## mousewheel 事件

在 [Stackoverflow 这个帖子](https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257) 中说到：Chrome 下做无限滚动时可能存在加载时间变得超长的问题。

目前猜测因为 passive listener 的特性所引发的，帖子里也给出了解决方法：在 mousewheel 里 `e.preventDefault` 就好。

```ts
class InfiniteScroll extends Component<Props, any> {
  ...

  mousewheelListener(e: Event) {
    // 详见: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
    // @ts-ignore mousewheel 事件里存在 deltaY
    if (e.deltaY === 1) {
      e.preventDefault()
    }
  }

  attachListeners() {
    const parentElement = this.getParentElement(this.scrollComponent)

    if (!parentElement || !this.props.hasMore) return

    const scrollEl = this.props.useWindow ? window : parentElement

    scrollEl.addEventListener('scroll', this.scrollListener)
    scrollEl.addEventListener('resize', this.scrollListener)
    scrollEl.addEventListener('mousewheel', this.mousewheelListener)
  }

  detachMousewheelListener() {
    const scrollEl = this.props.useWindow ? window : this.scrollComponent?.parentElement

    if (!scrollEl) return

    scrollEl.removeEventListener('mousewheel', this.mousewheelListener)
  }

  detachListeners() {
    const scrollEl = this.props.useWindow ? window : this.getParentElement(this.scrollComponent)

    if (!scrollEl) return

    scrollEl.removeEventListener('scroll', this.scrollListener)
    scrollEl.removeEventListener('resize', this.scrollListener)
  }

  componentWillUnmount() {
    this.detachListeners()
    this.detachMousewheelListener()
  }

  render() {
    ...
  }
}
```

上面同时把 `attachScrollListener` 改为 `attachListeners`，并在里面添加 mousewheel 的监听器，在 `componentWillUnmount` 里移除 mousewheel 的监听器。

## passive listener

上面提到了 passive listener，当监听器添加了 [passive 属性](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener#%E4%BD%BF%E7%94%A8_passive_%E6%94%B9%E5%96%84%E7%9A%84%E6%BB%9A%E5%B1%8F%E6%80%A7%E8%83%BD) 后，它就是 passive listener（被动监听器）。对 touch 和 mouse 的事件监听不会阻塞页面的滚动，可提高页面滚动性能。[详情可见这篇文章](https://cloud.tencent.com/developer/article/1004401)。

这里的两个监听器都可以设置 passive: true 来提高滚动性能，不过我们第一步是要检测当前浏览器是否支持被动监听器。

```ts
  isPassiveSupported() {
    let passive = false

    const testOptions = {
      get passive() {
        passive = true
        return true
      }
    }

    try {
      const testListener = () => {
      }
      document.addEventListener('test', testListener, testOptions)
      // @ts-ignore 仅用于测试是否可以使用 passive listener
      document.removeEventListener('test', testListener, testOptions)
    } catch (e) {
    }

    return passive
  }
```
上面给一个“假的”事件添加了一个“假的”被动监听器，并带个 `testOptions` 作为第三个参数。`testOptions` 利用 ES6 Proxy 的特性判断当前浏览器是否会读取 `passive` 属性，读取了说明支持 passive listener，返回 `true`。

再造一个函数获取监听器的 `options`，这个 `options` 包含了 `passive` 和 `useCapture`，前者为是否开启 passive 特性，后者为是否捕获。

```ts
interface EventListenerOptions {
  useCapture: boolean // 是否捕获
  passive: boolean // 是否 passive
}
```

```ts
class InfiniteScroll extends Component<Props, any> {
  ...
  private eventOptions = {} // 注册事件的选项

  ...
  
  isPassiveSupported() { // 当前是否支持 passive
    ...
  }

  mousewheelListener(e: Event) {
    // 详见: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
    // @ts-ignore mousewheel 事件里存在 deltaY
    if (e.deltaY === 1 && !this.isPassiveSupported()) {
      e.preventDefault()
    }
  }

  getEventListenerOptions() { // 获取监听器的 options
    const options: EventListenerOptions = {useCapture: this.props.useCapture || false, passive: false}

    if (this.isPassiveSupported()) {
      options.passive = true
    }

    return options
  }

  attachListeners() {
    const parentElement = this.getParentElement(this.scrollComponent)

    if (!parentElement || !this.props.hasMore) return

    const scrollEl = this.props.useWindow ? window : parentElement

    scrollEl.addEventListener('mousewheel', this.mousewheelListener, this.eventOptions) // 使用 eventOptions
    scrollEl.addEventListener('scroll', this.scrollListener, this.eventOptions) // 使用 eventOptions
    scrollEl.addEventListener('resize', this.scrollListener, this.eventOptions) // 使用 eventOptions

    if (this.props.initialLoad) {
      this.scrollListener()
    }
  }

  detachMousewheelListener() {
    const scrollEl = this.props.useWindow ? window : this.scrollComponent?.parentElement

    if (!scrollEl) return

    scrollEl.removeEventListener('mousewheel', this.mousewheelListener, this.eventOptions) // 使用 eventOptions
  }

  detachListeners() {
    const scrollEl = this.props.useWindow ? window : this.getParentElement(this.scrollComponent) // 使用 eventOptions

    if (!scrollEl) return

    scrollEl.removeEventListener('scroll', this.scrollListener, this.eventOptions) // 使用 eventOptions
    scrollEl.removeEventListener('resize', this.scrollListener, this.eventOptions) // 使用 eventOptions
  }
  
  ...
}
```

**注意：被动监听器里是不能有 `e.preventDefault` 的，因此在 `mousewheelListener` 里要做 `isPassiveSupported` 的判断，如果支持了 passive，就不执行 `e.preventDefault`。**

## 优化 render 函数

最后，`render` 函数还可以再进一步优化。首先，在 props 里添加 `element` 和 `ref`，前者为容器的 tagName，后者为获取滚动元素的回调：

```ts
interface Props {
  ...
  element?: string // 元素 tag 名
  ref?: (node: HTMLElement | null) => void // 获取要滚动的元素
}
```

然后改写 `render`

```ts
  render() {
    const {
      // 内部 props
      children, element, hasMore, isReverse, loader, loadMore, initialLoad,
      pageStart, ref, threshold, useCapture, useWindow, getScrollParent,
      // 需要 pass 的 props
      ...props
    } = this.props

    const childrenArray = [children]

    if (hasMore && loader) {
      isReverse ? childrenArray.unshift(loader) : childrenArray.push(loader)
    }

    const passProps = {
      ...props,
      ref: (node: HTMLElement | null) => {
        this.scrollComponent = node
        if (ref) {
          ref(node)
        }
      }
    }

    return createElement(element || 'div', passProps, childrenArray)
  }
```

这一步主要优化了 3 个点：
1. 将 tagName (`element` props) 也作为 props 暴露出来
2. 将剩下的 props 透传给滚动元素
3. 在  `passProps` 里添加 `ref`，开发者可以通过 `ref` 获取滚动元素

## 总结

这篇文章主要带大家过了一遍 [react-infinite-scroller](https://www.npmjs.com/package/react-infinite-scroller) 的源码，从 0 到 1 地实现了一遍源码。

核心部分为 `offset < threshold` 则加载更多，`offset` 的计算规则如下：

1. 向下滚动：`el.scrollHeight - parentElement.scrollTop - parentElement.clientHeight`
2. 下上滚动：`parentElement.scrollTop`
3. window 向下滚动：` calculateTopPosition(el) + (el.offsetHeight - scrollTop - window.innerHeight)`
  1. 其中 calculateTopPosition 为递归地计算元素顶部到浏览器窗口顶部的距离
4. window 向上滚动：`window.pageYOffset || doc.scrollTop`
  1. 其中 doc 为 `doc = document.documentElement || document.body.parentElement || document.body`

当然，这个轮子还有很多细节值得我们注意：

1. 除了 scroll 事件，resize 事件也应该触发加载更多
2. 在 mount 和 update 的时候添加 listener，在 unmounte 和 `offset < threshold` 时移除 listener。还有一点，在添加 listener 的时候可以触发一次 listener 作为 `initialLoad`
3. 向上滚动的时候，在 `componentDidUpdate` 里要把滚动条设置为上一次停留的地方，否则滚动条会一直在顶部，一直触发“加载更多”
4. 在 mousewheel 里 `e.preventDefault` 解决“加载更多”时间超长的问题
5. 添加被动监听器，提高页面滚动性能