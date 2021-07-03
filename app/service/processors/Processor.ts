import { Model } from 'objection'
import { Item } from '@/service/models/Item'

export interface ProcessorStatic {
  new (): Processor
  extensions: ReadonlyArray<string>
}

export interface ProcessResult {
  externalTable: typeof Model | null
}

export abstract class Processor {
  public abstract process(item: Item): Promise<ProcessResult>
}
