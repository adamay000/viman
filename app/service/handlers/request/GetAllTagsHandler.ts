import { Handler } from '@/service/handlers/Handler'
import { ItemTag } from '@/service/models/ItemTag'
import { handleCommonErrors } from '@/service/handlers/error'

export class GetAllTagsHandler extends Handler<'getAllTags'> {
  public async request() {
    const tags = (await ItemTag.query()
      .select('item_id')
      .count('item_id', { as: 'count' })
      .orderBy('count', 'desc')
      .orderBy('item_id', 'asc')
      .groupBy('tag_id')
      .withGraphFetched('tag')
      .catch((exception) => {
        handleCommonErrors(exception)
        throw exception
      })) as Array<WithRelation<ItemTag, 'tag'> & { count: number }>

    return {
      tags: tags.map((tag) => ({
        tagId: tag.tag.id,
        tagName: tag.tag.name,
        count: tag.count
      }))
    }
  }
}
