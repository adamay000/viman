import { JSONSchema, Model } from 'objection'
import { Inject, inject } from '@/service/injection'
import { Queue } from '@/utilities/queue'

export enum ItemStatus {
  Idle = 'idle',
  Errored = 'errored',
  Analyzed = 'analyzed'
}

export class Item extends Model {
  public readonly id!: number
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
      required: ['path', 'filename', 'extension', 'size'],
      properties: {
        path: {
          type: 'string',
          minLength: 1,
          maxLength: 2048
        },
        filename: {
          type: 'string',
          minLength: 1,
          maxLength: 2048
        },
        extension: {
          type: 'string',
          minLength: 1,
          maxLength: 2048
        },
        size: {
          type: 'integer',
          minimum: 0
        },
        status: {
          type: 'string',
          enum: Object.values(ItemStatus)
        },
        error: {
          type: ['string', 'null'],
          maxLength: 2048
        },
        external_table: {
          type: ['string', 'null'],
          minLength: 1,
          maxLength: 64
        }
      }
    }
  }
}
