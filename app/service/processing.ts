import { access } from 'fs'
import { promisify } from 'util'
import { Inject, inject } from '@/service/injection'
import { Queue } from '@/utilities/queue'
import { Item, ItemStatus } from '@/service/models/Item'
import { Processor, ProcessorStatic } from '@/service/processors/Processor'

class ProcessError extends Error {
  public static create(message: string) {
    return (originalError: Error) => {
      throw new ProcessError(originalError, message)
    }
  }

  private constructor(public readonly originalError: Error, message: string) {
    super(message)
  }
}

enum ProcessingStatus {
  Idle,
  Processing
}

export class Processing {
  @inject(Inject.Queue)
  private readonly queue!: Queue<Item>

  private status = ProcessingStatus.Idle

  private readonly processors: Partial<Record<string, Processor>> = {}

  private get isIdle() {
    return this.status === ProcessingStatus.Idle
  }

  public constructor() {
    this.queue.on('add', this.next.bind(this))
  }

  public addProcessor(processorClass: ProcessorStatic) {
    const processor = new processorClass()
    for (const extension of processorClass.extensions) {
      this.processors[extension] = processor
    }
  }

  public async loadQueue() {
    const items = await Item.query().where({ status: ItemStatus.Idle }).orWhere({ status: ItemStatus.Errored })
    for (const item of items) {
      this.queue.add(item)
    }
  }

  private async next() {
    if (!this.isIdle) return
    const item = this.queue.pop()
    if (!item) return

    console.log('Processing next item:', item.id)

    this.status = ProcessingStatus.Processing
    try {
      const externalTableClass = await this.process(item)
      const externalTableName = externalTableClass.externalTable?.tableName ?? null
      // Process succeeded
      await Item.query().findById(item.id).patch({
        status: ItemStatus.Analyzed,
        external_table: externalTableName
      })
    } catch (exception) {
      // Process failed
      const error = exception instanceof ProcessError ? exception.originalError : exception
      console.error('Processing failed:', error)
      await Item.query().findById(item.id).patch({
        status: ItemStatus.Errored,
        error: error.message
      })
    } finally {
      this.status = ProcessingStatus.Idle
    }

    await this.next()
  }

  private async process(item: Item) {
    await promisify(access)(item.path).catch(ProcessError.create(`File not found (${item.path})`))
    const processor = this.processors[item.extension]
    if (!processor) throw new Error(`No processor was found for extension '${item.extension}'`)

    return await processor.process(item)
  }
}
