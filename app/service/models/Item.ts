import { JSONSchema, Model } from 'objection'
import { basename } from 'path'
import { Inject, inject } from '@/service/injection'
import { Queue } from '@/utilities/queue'

export enum ItemStatus {
  Idle = 'idle',
  Errored = 'errored',
  Analyzed = 'analyzed'
}

export class Item extends Model {
  public readonly id!: string
  public readonly path!: string
  public readonly filename!: string
  public readonly extension!: string
  public readonly size!: number
  public readonly status!: ItemStatus
  public readonly error!: string | null
  public readonly external_table!: string | null

  @inject(Inject.Queue)
  private readonly queue!: Queue<Item>

  public override $afterInsert() {
    this.queue.add(this)
  }

  public override $afterUpdate() {
    if (this.status === ItemStatus.Idle) this.queue.add(this)
  }

  public static override get tableName() {
    return 'items'
  }

  public static override get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['id', 'path', 'filename', 'extension', 'size'],
      properties: {
        id: {
          type: 'string'
        },
        path: {
          type: 'string'
        },
        filename: {
          type: 'string'
        },
        extension: {
          type: 'string'
        },
        size: {
          type: 'integer'
        },
        status: {
          type: 'string',
          enum: Object.values(ItemStatus)
        },
        error: {
          type: ['string', 'null']
        },
        external_table: {
          type: ['string', 'null']
        }
      }
    }
  }

  public static generateId(path: string, size: number) {
    return `${size}-${basename(path)}`
  }
}
