import { EventEmitter } from 'eventemitter3'

export class Queue<T = unknown> extends EventEmitter<{ add: [] }> {
  private readonly items: Array<T> = []

  public constructor(private readonly comparator: (a: T, b: T) => boolean) {
    super()
  }

  public add(item: T) {
    if (this.exists(item)) return
    this.items.push(item)
    this.emit('add')
  }

  public pop() {
    if (this.items.length > 0) {
      return this.items.shift()
    }
    return null
  }

  public exists(target: T) {
    return this.items.some((item) => this.comparator(item, target))
  }
}
