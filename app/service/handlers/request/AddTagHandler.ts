import { UniqueViolationError } from 'objection'
import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { RequestChannel } from '@/ipc/channel'
import { RequestError } from '@/ipc/RequestError'
import { Tag } from '@/service/models/Tag'
import { ItemTag } from '@/service/models/ItemTag'
import { handleCommonErrors } from '@/service/handlers/error'

export class AddTagHandler extends Handler<'addTag'> {
  public async request(_context: HandlerContext, payload: RequestChannel['addTag']['request']) {
    const { tag, itemTag, tags } = await Tag.transaction(async (trx) => {
      const tag =
        (await Tag.query(trx).where({ name: payload.tagName }).first()) ||
        (await Tag.query(trx).insertAndFetch({ name: payload.tagName }))

      const itemTag = await ItemTag.query(trx).insertAndFetch({
        item_id: payload.itemId,
        tag_id: tag.id
      })

      const tags = (await ItemTag.query(trx).where({ item_id: payload.itemId }).withGraphFetched('tag')) as Array<
        WithRelation<ItemTag, 'tag'>
      >

      return { tag, itemTag, tags }
    }).catch((exception) => {
      if (exception instanceof UniqueViolationError) {
        throw RequestError.createError({
          code: RequestError.Code.TagConstraint,
          message: exception.message,
          detail: {
            table: exception.table,
            columns: exception.columns
          }
        })
      }

      handleCommonErrors(exception)
      throw exception
    })

    console.log(`New tag is added: id=${tag.id} name=${tag.name}`)
    console.log(`New itemTag is added: id=${itemTag.id} item_id=${itemTag.item_id} tag_id=${itemTag.tag_id}`)

    return {
      tags: tags.map((tag) => ({
        tagId: tag.tag_id,
        tagName: tag.tag.name
      })),
      suggestions: []
    }
  }
}
