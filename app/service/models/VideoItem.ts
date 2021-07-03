import { JSONSchema, Model } from 'objection'
import { Item } from '@/service/models/Item'

export class VideoItem extends Model {
  public readonly item_id!: string
  public readonly duration!: number
  public readonly thumbnail_timestamps!: string

  public readonly item?: Item

  public static override get tableName() {
    return 'video_items'
  }

  public static override get relationMappings() {
    return {
      item: {
        relation: Model.BelongsToOneRelation,
        modelClass: Item,
        join: {
          from: `${VideoItem.tableName}.item_id`,
          to: `${Item.tableName}.id`
        }
      }
    }
  }

  public static override get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['item_id', 'duration', 'thumbnail_timestamps'],
      properties: {
        item_id: {
          type: 'string'
        },
        duration: {
          type: 'number'
        },
        thumbnail_timestamps: {
          type: 'string'
        }
      }
    }
  }
}
