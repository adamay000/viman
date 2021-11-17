import { JSONSchema, Model } from 'objection'
import { ItemTag } from '@/service/models/ItemTag'

export class Tag extends Model {
  public readonly id!: number
  public readonly name!: string

  public static override get tableName() {
    return 'tags'
  }

  public static override get relationMappings() {
    return {
      itemTag: {
        relation: Model.HasManyRelation,
        modelClass: ItemTag,
        join: {
          from: `${Tag.tableName}.id`,
          to: `${ItemTag.tableName}.tag_id`
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
