import { resolve } from 'path'
import { readdir as _readdir } from 'fs'
import { promisify } from 'util'
import mkdirp from 'mkdirp'
import _rimraf from 'rimraf'
import urljoin from 'url-join'
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'
import jimp from 'jimp'
import isDev from 'electron-is-dev'
import { Item } from '@/service/models/Item'
import { VideoItem } from '@/service/models/VideoItem'
import { Processor } from '@/service/processors/Processor'
import { ipc } from '@/ipc/main'
import { PATH_VIDEO_THUMBNAIL } from '@/service/paths'
import { THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT } from '@/constants'

const readdir = promisify(_readdir)
const rimraf = promisify(_rimraf)
const ffprobe = promisify(ffmpeg.ffprobe)

if (isDev) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
  ffmpeg.setFfprobePath(ffprobeStatic.path)
} else {
  const ext = process.platform === 'win32' ? '.exe' : ''
  ffmpeg.setFfmpegPath(urljoin(process.resourcesPath, `ffmpeg${ext}`))
  ffmpeg.setFfprobePath(urljoin(process.resourcesPath, `ffprobe${ext}`))
}

export class VideoProcessor extends Processor {
  public static get extensions() {
    return ['.mp4', '.flv']
  }

  public async process(item: Item) {
    const startTime = Date.now()

    const { id, path } = item

    console.log('VideoProcessor', id, path)

    ipc.broadcast('status', {
      message: `[${id}] Getting metadata ...`,
      details: `${Date.now() - startTime}ms elapsed.`
    })
    const { duration, width, height } = await getMetadata(path)

    const { resizedWidth, resizedHeight } = getResizedSize(width, height)
    const size = `${resizedWidth}x${resizedHeight}`

    const temporallyDir = resolve(PATH_VIDEO_THUMBNAIL, `${id}`)
    const thumbnailDir = PATH_VIDEO_THUMBNAIL
    const thumbnailFile = resolve(thumbnailDir, `${id}.png`)
    const interval = duration < 100 ? 1 : duration < 200 ? 2 : duration < 300 ? 3 : duration < 600 ? 5 : 10
    const timestamps = createTimestamps(duration, interval)

    await mkdirp(temporallyDir)

    try {
      await this.saveThumbnails(path, id, temporallyDir, timestamps, size, startTime)
    } catch (exception) {
      console.error(exception)

      try {
        await new Promise((resolve, reject) => {
          ffmpeg(urljoin('file://', path), {
            logger: console
          })
            .on('error', reject)
            .on('end', resolve)
            .screenshots({
              timestamps: [0],
              filename: '%s.png',
              folder: thumbnailDir,
              size
            })
        })
      } catch (exception) {
        console.error(exception)
        throw exception
      }
    }

    await this.mergeThumbnails(temporallyDir, thumbnailFile, resizedWidth, id, startTime)

    await this.deleteTemporallyThumbnails(temporallyDir)

    ipc.broadcast('status', {
      message: `[${id}] Completed.`,
      details: `${Date.now() - startTime}ms elapsed.`
    })

    await VideoItem.query().insert({
      item_id: id,
      duration,
      thumbnail_timestamps: timestamps.join(',')
    })

    return {
      externalTable: VideoItem
    }
  }

  private async saveThumbnails(
    resizedFile: string,
    id: number,
    thumbnailDir: string,
    timestamps: Array<number>,
    size: string,
    startTime: number
  ) {
    let serialPromises = Promise.resolve()
    timestamps.forEach((timestamp, i) => {
      serialPromises = serialPromises.then(
        async () =>
          new Promise((resolve, reject) => {
            ffmpeg(resizedFile, {
              logger: console
            })
              .on('error', reject)
              .on('end', () => {
                const current = i + 1
                const total = timestamps.length
                ipc.broadcast('status', {
                  message: `[${id}] Creating thumbnails ...`,
                  details: `${current} / ${total} (${((current / total) * 100).toFixed(2)}%) ${
                    Date.now() - startTime
                  }ms elapsed.`
                })
                resolve()
              })
              .screenshots({
                timestamps: [timestamp],
                filename: '%s.png',
                folder: thumbnailDir,
                size
              })
          })
      )
    })
    await serialPromises
  }

  private async mergeThumbnails(
    temporallyDir: string,
    thumbnailFile: string,
    width: number,
    id: number,
    startTime: number
  ) {
    const files = (await readdir(temporallyDir))
      .filter((file) => /\.png$/i.test(file))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      .map((file) => resolve(temporallyDir, file))
    const length = files.length
    const images = await Promise.all(files.map(async (file) => jimp.read(file)))
    const offset = (THUMBNAIL_WIDTH - width) / 2
    const thumbnail = await jimp.create(THUMBNAIL_WIDTH * length, THUMBNAIL_HEIGHT, '#000000')
    images.forEach((image, i) => {
      const current = i + 1
      const total = files.length
      ipc.broadcast('status', {
        message: `[${id}] Merging thumbnails ...`,
        details: `${current} / ${total} (${((current / total) * 100).toFixed(2)}%) ${Date.now() - startTime}ms elapsed.`
      })
      thumbnail.blit(image, THUMBNAIL_WIDTH * i + offset, 0)
    })
    ipc.broadcast('status', {
      message: `[${id}] Merging thumbnails ...`,
      details: `${Date.now() - startTime}ms elapsed.`
    })
    await thumbnail.writeAsync(thumbnailFile)
  }

  private async deleteTemporallyThumbnails(temporallyDir: string) {
    await rimraf(temporallyDir)
  }
}

async function getMetadata(path: string): Promise<{ duration: number; width: number; height: number }> {
  let ffprobeData: FfprobeData
  try {
    ffprobeData = (await ffprobe.call(ffmpeg, path)) as FfprobeData
  } catch (exception) {
    console.error(exception)
    throw exception
  }

  return {
    duration: getDuration(ffprobeData),
    ...getSize(ffprobeData)
  }
}

function getDuration(ffprobeData: FfprobeData) {
  if (ffprobeData.format.duration && ffprobeData.format.duration > 0) {
    return ffprobeData.format.duration
  }

  const streams = ffprobeData.streams.filter(({ codecType }) => codecType === 'video')

  if (streams.length === 0 || streams.some(({ duration }) => !duration)) {
    throw new Error('Failed to get duration')
  }

  const duration = streams.reduce((duration, stream) => duration + parseFloat(stream.duration || ''), 0)

  if (duration > 0) {
    return duration
  }

  throw new Error('Failed to get duration')
}

function getSize(ffprobeData: FfprobeData) {
  const streams = ffprobeData.streams.filter((stream) => (stream?.width || 0) * (stream?.height || 0) > 0)

  if (!streams[0] || !streams[0].width || !streams[0].height) {
    throw new Error('Failed to get size')
  }

  return {
    width: streams[0].width,
    height: streams[0].height
  }
}

function getResizedSize(width: number, height: number) {
  const aspect = width / height
  const resizedAspect = THUMBNAIL_WIDTH / THUMBNAIL_HEIGHT
  // If video is landscape, use width as basis
  const ratio = aspect > resizedAspect ? THUMBNAIL_WIDTH / width : THUMBNAIL_HEIGHT / height
  return {
    resizedWidth: Math.ceil(width * ratio),
    resizedHeight: Math.ceil(height * ratio)
  }
}

function createTimestamps(duration: number, interval: number) {
  const quantity = Math.ceil(duration / interval)
  return Array(quantity)
    .fill(null)
    .map((_, i) => i * interval)
}
