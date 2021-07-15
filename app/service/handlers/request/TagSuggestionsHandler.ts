import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { ItemTag } from '@/service/models/ItemTag'
import { Tag } from '@/service/models/Tag'
import { RequestChannel } from '@/ipc/channel'

export class TagSuggestionsHandler extends Handler<'tagSuggestions'> {
  public async request(_context: HandlerContext, payload: RequestChannel['tagSuggestions']['request']) {
    const mostUsedTags = (await Tag.relatedQuery('itemTag')
      .for(Tag.query().where('name', 'like', `%${payload.tagName}%`))
      .select('tag_id')
      .groupBy('tag_id')
      .whereNotIn('tag_id', ItemTag.query().select('tag_id').where('item_id', payload.itemId))
      .count('tag_id', { as: 'count' })
      .orderBy('count', 'desc')
      .limit(payload.limit ?? 10)
      .withGraphFetched('tag')) as Array<WithRelation<ItemTag, 'tag'> & { count: number }>

    return {
      tags: mostUsedTags.map((tag) => ({
        tagId: tag.tag_id,
        tagName: tag.tag.name,
        count: tag.count
      }))
    }
  }
}
