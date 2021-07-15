import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { RequestChannel } from '@/ipc/channel'
import { ItemTag } from '@/service/models/ItemTag'
import { handleCommonErrors } from '@/service/handlers/error'

export class GetTagsHandler extends Handler<'getTags'> {
  public async request(_context: HandlerContext, payload: RequestChannel['getTags']['request']) {
    const tags = (await ItemTag.query()
      .where({ item_id: payload.itemId })
      .withGraphFetched('tag')
      .catch((exception) => {
        handleCommonErrors(exception)
        throw exception
      })) as Array<WithRelation<ItemTag, 'tag'>>

    return {
      tags: tags.map((tag) => ({
        tagId: tag.tag_id,
        tagName: tag.tag.name
      }))
    }
  }
}
