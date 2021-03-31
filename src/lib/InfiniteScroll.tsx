import * as React from 'react'
import {Component, ReactNode} from 'react'

interface Props {
  loadMore: Function
  loader: ReactNode
  throttle: number
}

class InfiniteScroll extends Component<Props, any> {
  private scrollComponent: HTMLDivElement | null = null
  private loadingMore = false

  constructor(props: Props) {
    super(props);
    this.scrollListener = this.scrollListener.bind(this)
  }

  scrollListener() {
    const node = this.scrollComponent
    if (!node) return

    const parentNode = node.parentElement

    if (!parentNode) return

    const offset = node.scrollHeight - parentNode.scrollTop - parentNode.clientHeight

    if (offset < this.props.throttle) {
      node.removeEventListener('scroll', this.scrollListener)

      this.props.loadMore()
      this.loadingMore = true
    }
  }

  componentDidMount() {
    if (this.scrollComponent && this.scrollComponent.parentElement) {
      this.scrollComponent.parentElement.addEventListener('scroll', this.scrollListener)
    }
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
