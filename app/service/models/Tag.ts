import { JSONSchema, Model } from 'objection'
import { Item } from '@/service/models/Item'

export class Tag extends Model {
  public readonly id!: number
  public readonly name!: string

  public static override get tableName() {
    return 'tags'
  }

  public static override get relationMappings() {
    return {
      item: {
        relation: Model.ManyToManyRelation,
        modelClass: Item,
        join: {
          from: `${Tag.tableName}.item_id`,
          to: `${Item.tableName}.id`
        }
      }
    }
  }

  public static override get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 256
        }
      }
    }
  }
}
