import { JSONSchema, Model } from 'objection'

export class WatchDirectory extends Model {
  public readonly id!: number
  public readonly path!: string
  public readonly recursive!: boolean

  public static override get tableName() {
    return 'watch_directories'
  }

  public static override get jsonSchema(): JSONSchema {
    return {
      type: 'object',
      required: ['path', 'recursive'],
      properties: {
        path: {
          type: 'string',
          minLength: 1,
          maxLength: 2048
        },
        recursive: {
          type: 'boolean'
        }
      }
    }
  }
}
