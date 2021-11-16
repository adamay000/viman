import { Model } from 'objection'
import { Handler, HandlerContext } from '@/service/handlers/Handler'
import { RequestChannel } from '@/ipc/channel'
import { VideoItem } from '@/service/models/VideoItem'
import { ItemTag } from '@/service/models/ItemTag'
import { Tag } from '@/service/models/Tag'

export class VideosByTagHandler extends Handler<'videosByTag'> {
  public async request(_context: HandlerContext, payload: RequestChannel['videosByTag']['request']) {
    const isAnd = payload.logic === 'and'

    const tags = await Tag.query().whereIn('id', payload.tagIds)
    const videos = await VideosByTagHandler.getVideos(isAnd, payload.tagIds)

    return {
      tags: tags.map((tag) => ({
        tagId: tag.id,
        tagName: tag.name
      })),
      videos: videos
        .filter((video) => Boolean(video.item))
        .map((video) => ({
          id: video.item.id,
          path: video.item.path,
          size: video.item.size,
          duration: video.duration,
          thumbnailTimestamps: video.thumbnail_timestamps.split(',').map(Number)
        }))
    }
  }

  private static async getVideos(
    isAnd: boolean,
    tagIds: Array<number>
  ): Promise<Array<WithRelation<VideoItem, 'item'>>> {
    if (!isAnd) {
      return (await VideoItem.query()
        .whereIn('item_id', ItemTag.query().select('item_id').whereIn('tag_id', tagIds))
        .withGraphFetched('item')) as Array<WithRelation<VideoItem, 'item'>>
    }

    return (await VideoItem.query()
      .whereIn(
        'item_id',
        Model.query()
          .select('item_id')
          .from(
            ItemTag.query()
              .select('item_id')
              .whereIn('tag_id', tagIds)
              .groupBy('item_id')
              .count('item_id', { as: 'count' })
              .having('count', '=', tagIds.length)
              .pluck('item_id')
          )
      )
      .withGraphFetched('item')) as Array<WithRelation<VideoItem, 'item'>>
  }
}
