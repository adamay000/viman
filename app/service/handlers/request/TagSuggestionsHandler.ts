import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { ItemTag } from '@/service/models/ItemTag'
import { Tag } from '@/service/models/Tag'
import { RequestChannel } from '@/ipc/channel'
import { Model } from 'objection'

export class TagSuggestionsHandler extends Handler<'tagSuggestions'> {
  public async request(_context: HandlerContext, payload: RequestChannel['tagSuggestions']['request']) {
    const limit = payload.limit ?? 10

    const mostUsedTags = (await Tag.relatedQuery('itemTag')
      .for(Tag.query().where('name', 'like', `%${payload.tagName}%`))
      .select('tag_id')
      .whereNotIn('tag_id', ItemTag.query().select('tag_id').where('item_id', payload.itemId))
      .count('tag_id', { as: 'count' })
      .orderBy('count', 'desc')
      .groupBy('tag_id')
      .limit(limit)
      .withGraphFetched('tag')) as Array<WithRelation<ItemTag, 'tag'> & { count: number }>

    const relatedTags = (await Tag.relatedQuery('itemTag')
      .for(Tag.query().where('name', 'like', `%${payload.tagName}%`))
      .select('tag_id')
      .whereNotIn('tag_id', ItemTag.query().select('tag_id').where('item_id', payload.itemId))
      .count('tag_id', { as: 'count' })
      .orderBy('count', 'desc')
      .groupBy('tag_id')
      .whereIn(
        'item_id',
        Model.query()
          .select('item_id')
          .from(
            ItemTag.query()
              .select('item_id')
              .count('item_id', { as: 'count' })
              .orderBy('count', 'desc')
              .groupBy('item_id')
              .whereNot('item_id', payload.itemId)
              .whereIn('tag_id', ItemTag.query().select('tag_id').where('item_id', payload.itemId))
              .limit(5)
              .pluck('item_id')
          )
      )
      .limit(limit)
      .withGraphFetched('tag')) as Array<WithRelation<ItemTag, 'tag'> & { count: number }>

    return {
      relatedTags: relatedTags.map((tag) => ({
        tagId: tag.tag_id,
        tagName: tag.tag.name,
        count: tag.count
      })),
      mostUsedTags: mostUsedTags.map((tag) => ({
        tagId: tag.tag_id,
        tagName: tag.tag.name,
        count: tag.count
      }))
    }
  }
}
