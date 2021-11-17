import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { RequestChannel } from '@/ipc/channel'
import { ItemTag } from '@/service/models/ItemTag'
import { Tag } from '@/service/models/Tag'
import { handleCommonErrors } from '@/service/handlers/error'

export class RemoveTagHandler extends Handler<'removeTag'> {
  public async request(_context: HandlerContext, payload: RequestChannel['removeTag']['request']) {
    const { tags } = await ItemTag.transaction(async (trx) => {
      await ItemTag.query(trx).delete().where({ item_id: payload.itemId, tag_id: payload.tagId })

      const tagsLeft = await ItemTag.query(trx).where({ tag_id: payload.tagId }).resultSize()

      if (tagsLeft === 0) {
        await Tag.query(trx).delete().where({ id: payload.tagId })
      }

      const tags = (await ItemTag.query(trx).where({ item_id: payload.itemId }).withGraphFetched('tag')) as Array<
        WithRelation<ItemTag, 'tag'>
      >

      return { tags }
    }).catch((exception) => {
      handleCommonErrors(exception)
      throw exception
    })

    return {
      tags: tags.map((tag) => ({
        tagId: tag.tag_id,
        tagName: tag.tag.name
      }))
    }
  }
}
