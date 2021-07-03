import { Handler } from '@/service/handlers/Handler'
import { VideoItem } from '@/service/models/VideoItem'

export class VideosHandler extends Handler<'videos'> {
  public async request() {
    const videos = (await VideoItem.query().withGraphFetched('item')) as Array<
      VideoItem & Pick<Required<VideoItem>, 'item'>
    >

    return {
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
}
