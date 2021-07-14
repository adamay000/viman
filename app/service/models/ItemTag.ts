import { JSONSchema, Model } from 'objection'
import { Item } from '@/service/models/Item'
import { Tag } from '@/service/models/Tag'

export class ItemTag extends Model {
  public readonly id!: number
  public readonly item_id!: number
  public readonly tag_id!: number

  public readonly tag?: Tag
  public readonly item?: Item

  public static override get tableName() {
    return 'item_tags'
  }

  public static override get relationMappings() {
    return {
      item: {
        relation: Model.BelongsToOneRelation,
        modelClass: Item,
        join: {
          from: `${ItemTag.tableName}.item_id`,
          to: `${Item.tableName}.id`
        }
      },
      tag: {
        relation: Model.BelongsToOneRelation,
        modelClass: Tag,
        join: {
          from: `${ItemTag.tableName}.tag_id`,
          to: `${Tag.tableName}.id`
        }
      }
    }
  }

  public static override get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['item_id', 'tag_id'],
      properties: {
        item_id: {
          type: 'number',
          minimum: 0
        },
        tag_id: {
          type: 'number',
          minimum: 0
        }
      }
    }
  }
}
